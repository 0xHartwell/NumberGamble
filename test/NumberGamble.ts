import { expect } from "chai";
import { ethers } from "hardhat";

describe("NumberGamble", function () {
  it("full flow: create, join, start, continue/fold, open", async function () {
    const [creator, p1, p2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("NumberGamble");
    const game = await Factory.deploy();
    await game.waitForDeployment();

    // Create
    const txCreate = await game.connect(creator).createGame(2);
    const receiptCreate = await txCreate.wait();
    const gameId = await game.gameCount();
    expect(gameId).to.eq(1n);

    // Join two players
    const JOIN_FEE = await game.JOIN_FEE();
    await expect(game.connect(p1).join(gameId, { value: JOIN_FEE })).to.emit(game, "Joined");
    await expect(game.connect(p2).join(gameId, { value: JOIN_FEE })).to.emit(game, "Joined");

    // Start by creator
    await expect(game.connect(creator).start(gameId)).to.emit(game, "Started");

    // Each player should get encrypted rolls (bytes32 not zero)
    const e1 = await game.connect(p1).getMyEncryptedRolls(gameId, await p1.getAddress());
    const e2 = await game.connect(p2).getMyEncryptedRolls(gameId, await p2.getAddress());
    for (let i = 0; i < 3; i++) {
      expect(e1[i]).to.not.eq(ethers.ZeroHash);
      expect(e2[i]).to.not.eq(ethers.ZeroHash);
    }

    // Player1 continues, Player2 folds
    const CONT_FEE = await game.CONTINUE_FEE();
    await expect(game.connect(p1).cont(gameId, { value: CONT_FEE })).to.emit(game, "Continued");
    await expect(game.connect(p2).fold(gameId)).to.emit(game, "Folded").and.to.emit(game, "ReadyToOpen");

    // Compute expected winner: only p1 continued -> winner p1 unless edge-case
    const beforeP1 = await ethers.provider.getBalance(p1.address);
    const pot = (await game.games(gameId)).pot;
    await expect(game.connect(creator).open(gameId)).to.emit(game, "Opened");
    const g = await game.games(gameId);
    expect(g.winner).to.eq(p1.address);

    // Check pot transferred out of contract
    expect(await ethers.provider.getBalance(await game.getAddress())).to.eq(0);
  });

  it("winner selected among continued players using seed", async function () {
    const [creator, a, b, c] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("NumberGamble");
    const game = await Factory.deploy();
    await game.waitForDeployment();

    const txCreate = await game.connect(creator).createGame(3);
    await txCreate.wait();
    const gameId = await game.gameCount();
    const JOIN_FEE = await game.JOIN_FEE();
    await game.connect(a).join(gameId, { value: JOIN_FEE });
    await game.connect(b).join(gameId, { value: JOIN_FEE });
    await game.connect(c).join(gameId, { value: JOIN_FEE });
    await game.connect(creator).start(gameId);

    const seed: string = (await game.games(gameId)).seed as any;

    function roll(seedHex: string, addr: string, idx: number): number {
      const encoded = ethers.solidityPacked(["bytes32", "address", "uint8"], [seedHex, addr, idx]);
      const h = ethers.keccak256(encoded);
      const mod = Number(BigInt(h) % 6n);
      return mod + 1;
    }
    function max3(seedHex: string, addr: string): number {
      const r0 = roll(seedHex, addr, 0);
      const r1 = roll(seedHex, addr, 1);
      const r2 = roll(seedHex, addr, 2);
      return Math.max(r0, r1, r2);
    }

    // a & c continue; b folds
    const CONT_FEE = await game.CONTINUE_FEE();
    await game.connect(a).cont(gameId, { value: CONT_FEE });
    await game.connect(b).fold(gameId);
    await game.connect(c).cont(gameId, { value: CONT_FEE });

    const ma = max3(seed, a.address);
    const mc = max3(seed, c.address);
    let expectedWinner = a.address;
    if (mc > ma || (mc === ma && c.address.toLowerCase() < a.address.toLowerCase())) {
      expectedWinner = c.address;
    }

    await game.connect(creator).open(gameId);
    const g = await game.games(gameId);
    expect(g.winner).to.eq(expectedWinner);
  });
});
