// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title NumberGamble - Simple FHE dice game
/// @notice Creator sets capacity (2-5). Players join with join fee. When full, creator starts and each player receives 3 encrypted rolls (1-6).
/// Players decrypt their own rolls off-chain via relayer, then either Continue (pay continue fee) or Fold. After all responded, creator opens
/// and the highest max roll among continued players wins the pot.
contract NumberGamble is SepoliaConfig {
    enum GameState {
        Waiting,
        Started,
        ReadyToOpen,
        Finished
    }

    enum ActionState {
        None,
        Continued,
        Folded
    }

    uint256 public constant JOIN_FEE = 0.0001 ether;
    uint256 public constant CONTINUE_FEE = 0.0001 ether;
    uint8 public constant MIN_CAPACITY = 2;
    uint8 public constant MAX_CAPACITY = 5;

    struct Game {
        address creator;
        uint8 capacity;
        GameState state;
        uint256 pot; // total wei in the game
        bytes32 seed; // randomness seed to derive plaintext rolls
        address winner;
    }

    uint256 public gameCount;
    mapping(uint256 => Game) public games;
    mapping(uint256 => address[]) private _players;
    mapping(uint256 => mapping(address => bool)) public isPlayer;
    mapping(uint256 => mapping(address => ActionState)) public actions;

    // Encrypted rolls per player (3 dice). Stored as FHE handles and ACL granted to player.
    mapping(uint256 => mapping(address => euint32[3])) private _encRolls;

    event GameCreated(uint256 indexed gameId, address indexed creator, uint8 capacity);
    event Joined(uint256 indexed gameId, address indexed player);
    event Started(uint256 indexed gameId);
    event Continued(uint256 indexed gameId, address indexed player);
    event Folded(uint256 indexed gameId, address indexed player);
    event ReadyToOpen(uint256 indexed gameId);
    event Opened(uint256 indexed gameId, address indexed winner, uint256 pot);

    error InvalidCapacity();
    error NotCreator();
    error WrongValue();
    error NotWaiting();
    error NotStarted();
    error AlreadyPlayer();
    error GameFull();
    error NotPlayer();
    error AlreadyActed();
    error NotReadyToOpen();

    /// @notice Create a new game with given capacity
    function createGame(uint8 capacity) external returns (uint256 gameId) {
        if (capacity < MIN_CAPACITY || capacity > MAX_CAPACITY) revert InvalidCapacity();
        gameId = ++gameCount;
        games[gameId] = Game({
            creator: msg.sender,
            capacity: capacity,
            state: GameState.Waiting,
            pot: 0,
            seed: 0,
            winner: address(0)
        });
        emit GameCreated(gameId, msg.sender, capacity);
    }

    /// @notice Join a waiting game by paying the join fee
    function join(uint256 gameId) external payable {
        Game storage g = games[gameId];
        if (g.state != GameState.Waiting) revert NotWaiting();
        if (msg.value != JOIN_FEE) revert WrongValue();
        if (isPlayer[gameId][msg.sender]) revert AlreadyPlayer();

        address[] storage players = _players[gameId];
        if (players.length >= g.capacity) revert GameFull();

        isPlayer[gameId][msg.sender] = true;
        players.push(msg.sender);
        g.pot += msg.value;
        emit Joined(gameId, msg.sender);
    }

    /// @notice Start the game when full. Only creator can start.
    function start(uint256 gameId) external {
        Game storage g = games[gameId];
        if (msg.sender != g.creator) revert NotCreator();
        if (g.state != GameState.Waiting) revert NotWaiting();

        address[] storage players = _players[gameId];
        require(players.length == g.capacity, "Not full");

        // Derive a randomness seed and deal encrypted rolls
        bytes32 seed = keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, gameId, players));
        g.seed = seed;

        for (uint256 i = 0; i < players.length; i++) {
            address p = players[i];
            euint32[3] storage enc = _encRolls[gameId][p];
            // Generate three dice in [1..6] deterministically from seed
            for (uint256 j = 0; j < 3; j++) {
                uint8 roll = _roll(seed, p, uint8(j));
                euint32 er = FHE.asEuint32(roll);
                enc[j] = er;
                // ACL: contract and player can access for later computations/user-decrypt
                FHE.allowThis(enc[j]);
                FHE.allow(enc[j], p);
            }
        }

        g.state = GameState.Started;
        emit Started(gameId);
    }

    /// @notice Player decides to continue. Requires continue fee.
    function cont(uint256 gameId) external payable {
        Game storage g = games[gameId];
        if (g.state != GameState.Started) revert NotStarted();
        if (!isPlayer[gameId][msg.sender]) revert NotPlayer();
        if (msg.value != CONTINUE_FEE) revert WrongValue();
        if (actions[gameId][msg.sender] != ActionState.None) revert AlreadyActed();

        actions[gameId][msg.sender] = ActionState.Continued;
        g.pot += msg.value;
        emit Continued(gameId, msg.sender);

        _maybeReadyToOpen(gameId);
    }

    /// @notice Player decides to fold.
    function fold(uint256 gameId) external {
        Game storage g = games[gameId];
        if (g.state != GameState.Started) revert NotStarted();
        if (!isPlayer[gameId][msg.sender]) revert NotPlayer();
        if (actions[gameId][msg.sender] != ActionState.None) revert AlreadyActed();

        actions[gameId][msg.sender] = ActionState.Folded;
        emit Folded(gameId, msg.sender);

        _maybeReadyToOpen(gameId);
    }

    /// @notice Creator opens the game once all players have acted. Transfers pot to winner among continued players.
    function open(uint256 gameId) external {
        Game storage g = games[gameId];
        if (msg.sender != g.creator) revert NotCreator();
        if (g.state != GameState.ReadyToOpen) revert NotReadyToOpen();

        address[] storage players = _players[gameId];
        require(players.length > 0, "No players");

        // Determine winner among Continued players based on max of 3 rolls.
        address currentWinner = address(0);
        uint8 currentBest = 0;

        for (uint256 i = 0; i < players.length; i++) {
            address p = players[i];
            if (actions[gameId][p] != ActionState.Continued) continue;
            uint8 m = _maxOfThree(g.seed, p);
            if (currentWinner == address(0) || m > currentBest || (m == currentBest && p < currentWinner)) {
                currentWinner = p;
                currentBest = m;
            }
        }

        // If everyone folded, fall back to creator to reclaim pot
        if (currentWinner == address(0)) {
            currentWinner = g.creator;
        }

        g.state = GameState.Finished;
        g.winner = currentWinner;
        uint256 amount = g.pot;
        g.pot = 0;

        (bool ok, ) = currentWinner.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Opened(gameId, currentWinner, amount);
    }

    /// @notice Returns players of a game
    function getPlayers(uint256 gameId) external view returns (address[] memory) {
        return _players[gameId];
    }

    /// @notice Return encrypted rolls for caller
    function getMyEncryptedRolls(uint256 gameId) external view returns (euint32[3] memory) {
        require(isPlayer[gameId][msg.sender], "Not in game");
        return _encRolls[gameId][msg.sender];
    }

    /// @notice Helper to check per-player state in a game
    function getAction(uint256 gameId, address player) external view returns (ActionState) {
        return actions[gameId][player];
    }

    function _maybeReadyToOpen(uint256 gameId) internal {
        Game storage g = games[gameId];
        address[] storage players = _players[gameId];

        for (uint256 i = 0; i < players.length; i++) {
            if (actions[gameId][players[i]] == ActionState.None) {
                return;
            }
        }
        g.state = GameState.ReadyToOpen;
        emit ReadyToOpen(gameId);
    }

    function _roll(bytes32 seed, address p, uint8 idx) internal pure returns (uint8) {
        // 1..6
        uint256 r = uint256(keccak256(abi.encodePacked(seed, p, idx)));
        return uint8((r % 6) + 1);
    }

    function _maxOfThree(bytes32 seed, address p) internal pure returns (uint8) {
        uint8 a = _roll(seed, p, 0);
        uint8 b = _roll(seed, p, 1);
        uint8 c = _roll(seed, p, 2);
        uint8 m = a > b ? a : b;
        return m > c ? m : c;
    }

    receive() external payable {}
}

