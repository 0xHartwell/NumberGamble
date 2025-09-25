// NumberGamble contract on Sepolia
// Update CONTRACT_ADDRESS after deployment to Sepolia.
export const CONTRACT_ADDRESS = '0x723e45D07A257551Dd86532dA06198D96222Ed02' as const;

// Copied ABI from artifacts/contracts/NumberGamble.sol/NumberGamble.json
// Note: Do not import JSON files in frontend per project rules.
export const CONTRACT_ABI = [
  { "inputs": [], "name": "AlreadyActed", "type": "error" },
  { "inputs": [], "name": "AlreadyPlayer", "type": "error" },
  { "inputs": [], "name": "GameFull", "type": "error" },
  { "inputs": [], "name": "InvalidCapacity", "type": "error" },
  { "inputs": [], "name": "NotCreator", "type": "error" },
  { "inputs": [], "name": "NotPlayer", "type": "error" },
  { "inputs": [], "name": "NotReadyToOpen", "type": "error" },
  { "inputs": [], "name": "NotStarted", "type": "error" },
  { "inputs": [], "name": "NotWaiting", "type": "error" },
  { "inputs": [], "name": "WrongValue", "type": "error" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "player", "type": "address" } ], "name": "Continued", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "player", "type": "address" } ], "name": "Folded", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "creator", "type": "address" }, { "indexed": false, "internalType": "uint8", "name": "capacity", "type": "uint8" } ], "name": "GameCreated", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "player", "type": "address" } ], "name": "Joined", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "winner", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "pot", "type": "uint256" } ], "name": "Opened", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "ReadyToOpen", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "Started", "type": "event" },
  { "inputs": [], "name": "CONTINUE_FEE", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "JOIN_FEE", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "MAX_CAPACITY", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "MIN_CAPACITY", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" } ], "name": "actions", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "cont", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [ { "internalType": "uint8", "name": "capacity", "type": "uint8" } ], "name": "createGame", "outputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "fold", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "gameCount", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "games", "outputs": [ { "internalType": "address", "name": "creator", "type": "address" }, { "internalType": "uint8", "name": "capacity", "type": "uint8" }, { "internalType": "uint8", "name": "state", "type": "uint8" }, { "internalType": "uint256", "name": "pot", "type": "uint256" }, { "internalType": "bytes32", "name": "seed", "type": "bytes32" }, { "internalType": "address", "name": "winner", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "internalType": "address", "name": "player", "type": "address" } ], "name": "getAction", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "getMyEncryptedRolls", "outputs": [ { "internalType": "bytes32[3]", "name": "", "type": "bytes32[3]" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "getPlayers", "outputs": [ { "internalType": "address[]", "name": "", "type": "address[]" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" } ], "name": "isPlayer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "join", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "open", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "start", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "stateMutability": "payable", "type": "receive" }
] as const;
