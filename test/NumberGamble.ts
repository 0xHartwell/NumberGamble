import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { NumberGamble } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("NumberGamble", function () {
  let numberGamble: NumberGamble;
  let signers: any[];
  const ENTRY_FEE = ethers.parseEther("0.0001");
  const CONTINUE_FEE = ethers.parseEther("0.0001");

  beforeEach(async function () {
    signers = await ethers.getSigners();
    const numberGambleFactory = await ethers.getContractFactory("NumberGamble");
    numberGamble = await numberGambleFactory.deploy();
    await numberGamble.waitForDeployment();
  });

  describe("Game Creation", function () {
    it("Should create a game with correct parameters", async function () {
      const maxPlayers = 3;
      
      await expect(
        numberGamble.connect(signers[0]).createGame(maxPlayers, { value: ENTRY_FEE })
      )
        .to.emit(numberGamble, "GameCreated")
        .withArgs(0, signers[0].address, maxPlayers)
        .and.to.emit(numberGamble, "PlayerJoined")
        .withArgs(0, signers[0].address);

      const gameInfo = await numberGamble.getGameInfo(0);
      expect(gameInfo.creator).to.equal(signers[0].address);
      expect(gameInfo.maxPlayers).to.equal(maxPlayers);
      expect(gameInfo.state).to.equal(0); // WaitingForPlayers
      expect(gameInfo.totalPrize).to.equal(ENTRY_FEE);
      expect(gameInfo.players).to.have.length(1);
      expect(gameInfo.players[0]).to.equal(signers[0].address);
    });

    it("Should fail with invalid max players", async function () {
      await expect(
        numberGamble.connect(signers[0]).createGame(1, { value: ENTRY_FEE })
      ).to.be.revertedWith("Max players must be between 2 and 5");

      await expect(
        numberGamble.connect(signers[0]).createGame(6, { value: ENTRY_FEE })
      ).to.be.revertedWith("Max players must be between 2 and 5");
    });

    it("Should fail with incorrect entry fee", async function () {
      await expect(
        numberGamble.connect(signers[0]).createGame(3, { value: ethers.parseEther("0.0002") })
      ).to.be.revertedWith("Must send exactly 0.0001 ETH");
    });
  });

  describe("Joining Games", function () {
    beforeEach(async function () {
      await numberGamble.connect(signers[0]).createGame(3, { value: ENTRY_FEE });
    });

    it("Should allow players to join a game", async function () {
      await expect(
        numberGamble.connect(signers[1]).joinGame(0, { value: ENTRY_FEE })
      )
        .to.emit(numberGamble, "PlayerJoined")
        .withArgs(0, signers[1].address);

      const gameInfo = await numberGamble.getGameInfo(0);
      expect(gameInfo.players).to.have.length(2);
      expect(gameInfo.players[1]).to.equal(signers[1].address);
      expect(gameInfo.totalPrize).to.equal(ENTRY_FEE * BigInt(2));
    });

    it("Should prevent double joining", async function () {
      await expect(
        numberGamble.connect(signers[0]).joinGame(0, { value: ENTRY_FEE })
      ).to.be.revertedWith("Player already joined");
    });

    it("Should prevent joining full games", async function () {
      await numberGamble.connect(signers[1]).joinGame(0, { value: ENTRY_FEE });
      await numberGamble.connect(signers[2]).joinGame(0, { value: ENTRY_FEE });
      
      await expect(
        numberGamble.connect(signers[3]).joinGame(0, { value: ENTRY_FEE })
      ).to.be.revertedWith("Game is full");
    });

    it("Should fail with incorrect entry fee", async function () {
      await expect(
        numberGamble.connect(signers[1]).joinGame(0, { value: ethers.parseEther("0.0002") })
      ).to.be.revertedWith("Must send exactly 0.0001 ETH");
    });
  });

  describe("Starting Games", function () {
    beforeEach(async function () {
      await numberGamble.connect(signers[0]).createGame(3, { value: ENTRY_FEE });
      await numberGamble.connect(signers[1]).joinGame(0, { value: ENTRY_FEE });
      await numberGamble.connect(signers[2]).joinGame(0, { value: ENTRY_FEE });
    });

    it("Should allow creator to start full game", async function () {
      await expect(
        numberGamble.connect(signers[0]).startGame(0)
      ).to.emit(numberGamble, "GameStarted").withArgs(0);

      const gameInfo = await numberGamble.getGameInfo(0);
      expect(gameInfo.state).to.equal(2); // DecisionPhase
    });

    it("Should prevent non-creator from starting game", async function () {
      await expect(
        numberGamble.connect(signers[1]).startGame(0)
      ).to.be.revertedWith("Only game creator can perform this action");
    });

    it("Should prevent starting non-full games", async function () {
      await numberGamble.connect(signers[0]).createGame(4, { value: ENTRY_FEE });
      
      await expect(
        numberGamble.connect(signers[0]).startGame(1)
      ).to.be.revertedWith("Game is not full yet");
    });

    it("Should generate encrypted numbers for all players", async function () {
      await numberGamble.connect(signers[0]).startGame(0);

      // Each player should be able to access their numbers
      const player1Numbers = await numberGamble.connect(signers[0]).getPlayerNumbers(0);
      const player2Numbers = await numberGamble.connect(signers[1]).getPlayerNumbers(0);
      const player3Numbers = await numberGamble.connect(signers[2]).getPlayerNumbers(0);

      expect(player1Numbers).to.have.length(3);
      expect(player2Numbers).to.have.length(3);
      expect(player3Numbers).to.have.length(3);
    });
  });

  describe("Player Decisions", function () {
    beforeEach(async function () {
      await numberGamble.connect(signers[0]).createGame(2, { value: ENTRY_FEE });
      await numberGamble.connect(signers[1]).joinGame(0, { value: ENTRY_FEE });
      await numberGamble.connect(signers[0]).startGame(0);
    });

    it("Should allow players to continue with payment", async function () {
      await expect(
        numberGamble.connect(signers[0]).makeDecision(0, true, { value: CONTINUE_FEE })
      )
        .to.emit(numberGamble, "PlayerDecisionMade")
        .withArgs(0, signers[0].address, 1); // Continue = 1

      const decision = await numberGamble.getPlayerDecision(0, signers[0].address);
      expect(decision).to.equal(1); // Continue

      const gameInfo = await numberGamble.getGameInfo(0);
      expect(gameInfo.totalPrize).to.equal(ENTRY_FEE * BigInt(2) + CONTINUE_FEE);
    });

    it("Should allow players to give up without payment", async function () {
      await expect(
        numberGamble.connect(signers[0]).makeDecision(0, false, { value: 0 })
      )
        .to.emit(numberGamble, "PlayerDecisionMade")
        .withArgs(0, signers[0].address, 2); // GiveUp = 2

      const decision = await numberGamble.getPlayerDecision(0, signers[0].address);
      expect(decision).to.equal(2); // GiveUp
    });

    it("Should prevent double decisions", async function () {
      await numberGamble.connect(signers[0]).makeDecision(0, true, { value: CONTINUE_FEE });
      
      await expect(
        numberGamble.connect(signers[0]).makeDecision(0, false, { value: 0 })
      ).to.be.revertedWith("Decision already made");
    });

    it("Should fail continue without correct fee", async function () {
      await expect(
        numberGamble.connect(signers[0]).makeDecision(0, true, { value: 0 })
      ).to.be.revertedWith("Must send 0.0001 ETH to continue");
    });

    it("Should fail give up with payment", async function () {
      await expect(
        numberGamble.connect(signers[0]).makeDecision(0, false, { value: CONTINUE_FEE })
      ).to.be.revertedWith("No payment needed to give up");
    });

    it("Should emit NumbersRevealed when all players decide", async function () {
      await numberGamble.connect(signers[0]).makeDecision(0, true, { value: CONTINUE_FEE });
      
      await expect(
        numberGamble.connect(signers[1]).makeDecision(0, true, { value: CONTINUE_FEE })
      ).to.emit(numberGamble, "NumbersRevealed").withArgs(0);
    });
  });

  describe("Game Completion", function () {
    beforeEach(async function () {
      await numberGamble.connect(signers[0]).createGame(2, { value: ENTRY_FEE });
      await numberGamble.connect(signers[1]).joinGame(0, { value: ENTRY_FEE });
      await numberGamble.connect(signers[0]).startGame(0);
    });

    it("Should allow creator to reveal and finish after all decisions", async function () {
      await numberGamble.connect(signers[0]).makeDecision(0, true, { value: CONTINUE_FEE });
      await numberGamble.connect(signers[1]).makeDecision(0, true, { value: CONTINUE_FEE });

      const contractBalanceBefore = await ethers.provider.getBalance(await numberGamble.getAddress());
      const totalPrize = ENTRY_FEE * BigInt(2) + CONTINUE_FEE * BigInt(2);
      
      await expect(
        numberGamble.connect(signers[0]).revealAndFinish(0)
      ).to.emit(numberGamble, "GameFinished");

      const gameInfo = await numberGamble.getGameInfo(0);
      expect(gameInfo.state).to.equal(3); // Finished
      expect(gameInfo.winner).to.not.equal(ethers.ZeroAddress);
      
      const contractBalanceAfter = await ethers.provider.getBalance(await numberGamble.getAddress());
      expect(contractBalanceBefore - contractBalanceAfter).to.equal(totalPrize);
    });

    it("Should prevent revealing before all decisions", async function () {
      await numberGamble.connect(signers[0]).makeDecision(0, true, { value: CONTINUE_FEE });
      
      await expect(
        numberGamble.connect(signers[0]).revealAndFinish(0)
      ).to.be.revertedWith("Not all players have decided");
    });

    it("Should handle case where no players continue", async function () {
      await numberGamble.connect(signers[0]).makeDecision(0, false, { value: 0 });
      await numberGamble.connect(signers[1]).makeDecision(0, false, { value: 0 });
      
      await expect(
        numberGamble.connect(signers[0]).revealAndFinish(0)
      ).to.be.revertedWith("No players continued, cannot determine winner");
    });

    it("Should allow players to access their scores after continuing", async function () {
      await numberGamble.connect(signers[0]).makeDecision(0, true, { value: CONTINUE_FEE });
      await numberGamble.connect(signers[1]).makeDecision(0, false, { value: 0 });

      // Player who continued should be able to get their score
      const score = await numberGamble.connect(signers[0]).getPlayerScore(0);
      expect(score).to.not.equal(0);

      // Player who gave up should not be able to get score
      await expect(
        numberGamble.connect(signers[1]).getPlayerScore(0)
      ).to.be.revertedWith("Player did not continue");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await numberGamble.connect(signers[0]).createGame(2, { value: ENTRY_FEE });
    });

    it("Should return correct game count", async function () {
      expect(await numberGamble.getTotalGames()).to.equal(1);
      
      await numberGamble.connect(signers[1]).createGame(3, { value: ENTRY_FEE });
      expect(await numberGamble.getTotalGames()).to.equal(2);
    });

    it("Should return player's games", async function () {
      const player0Games = await numberGamble.getPlayerGames(signers[0].address);
      expect(player0Games).to.have.length(1);
      expect(player0Games[0]).to.equal(0);

      await numberGamble.connect(signers[1]).joinGame(0, { value: ENTRY_FEE });
      const player1Games = await numberGamble.getPlayerGames(signers[1].address);
      expect(player1Games).to.have.length(1);
      expect(player1Games[0]).to.equal(0);
    });

    it("Should prevent accessing numbers before game starts", async function () {
      await expect(
        numberGamble.connect(signers[0]).getPlayerNumbers(0)
      ).to.be.revertedWith("Game not started yet");
    });
  });

  const anyValue: any = (value: any) => value;
});