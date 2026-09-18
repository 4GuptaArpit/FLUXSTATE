import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("FluxMarket - Brutal Security & Adversarial Test Suite", function () {
  let owner, attacker, user1, user2;
  let oracle, market;
  const feedId = ethers.encodeBytes32String("MON_USD");
  const roundDuration = 3; // 3 seconds

  beforeEach(async function () {
    [owner, attacker, user1, user2] = await ethers.getSigners();

    // Deploy Mock Oracle
    const OracleFactory = await ethers.getContractFactory("MockPriceOracle");
    oracle = await OracleFactory.deploy();
    await oracle.waitForDeployment();

    // Deploy FluxMarket
    const MarketFactory = await ethers.getContractFactory("FluxMarket");
    market = await MarketFactory.deploy(await oracle.getAddress(), feedId, roundDuration);
    await market.waitForDeployment();

    // Set initial oracle price
    await oracle.setPrice(feedId, 4285000, -6);
  });

  describe("1. Constructor & Invariant Checks", function () {
    it("Rejects zero address oracle", async function () {
      const MarketFactory = await ethers.getContractFactory("FluxMarket");
      await expect(
        MarketFactory.deploy(ethers.ZeroAddress, feedId, roundDuration)
      ).to.be.revertedWith("Invalid oracle address");
    });

    it("Rejects duration < 2 seconds", async function () {
      const MarketFactory = await ethers.getContractFactory("FluxMarket");
      await expect(
        MarketFactory.deploy(await oracle.getAddress(), feedId, 1)
      ).to.be.revertedWith("Duration too short");
    });
  });

  describe("2. Access Control & Authorization (No Backdoors)", function () {
    it("Attacker cannot call startRound", async function () {
      await expect(
        market.connect(attacker).startRound()
      ).to.be.revertedWith("FluxMarket: caller is not owner");
    });

    it("Attacker cannot call lockRound", async function () {
      await market.startRound();
      await expect(
        market.connect(attacker).lockRound(1)
      ).to.be.revertedWith("FluxMarket: caller is not owner");
    });

    it("Attacker cannot call resolveRound", async function () {
      await market.startRound();
      await expect(
        market.connect(attacker).resolveRound(1)
      ).to.be.revertedWith("FluxMarket: caller is not owner");
    });

    it("Attacker cannot tamper with oracle prices", async function () {
      await expect(
        oracle.connect(attacker).setPrice(feedId, 9999999, -6)
      ).to.be.revertedWith("MockPriceOracle: caller is not owner");
    });
  });

  describe("3. Timing & State Manipulation Attacks", function () {
    it("Rejects bets after lockTimestamp", async function () {
      await market.startRound();
      
      // Fast forward time past lockTimestamp
      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Round betting locked");
    });

    it("Cannot lock round before lockTimestamp", async function () {
      await market.startRound();
      await expect(
        market.lockRound(1)
      ).to.be.revertedWith("Not yet lockable");
    });

    it("Cannot resolve round before closeTimestamp", async function () {
      await market.startRound();
      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.lockRound(1);

      await expect(
        market.resolveRound(1)
      ).to.be.revertedWith("Round close time not reached");
    });

    it("Cannot double-lock or double-resolve a round", async function () {
      await market.startRound();
      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.lockRound(1);

      // Attempt second lock
      await expect(market.lockRound(1)).to.be.revertedWith("Already locked");

      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.resolveRound(1);

      // Attempt second resolve
      await expect(market.resolveRound(1)).to.be.revertedWith("Round already resolved");
    });
  });

  describe("4. Economic Exploits & Payout Math Vulnerabilities", function () {
    it("Zero-amount bet is strictly blocked", async function () {
      await market.startRound();
      await expect(
        market.connect(user1).placeBet(1, 0, { value: 0 })
      ).to.be.revertedWith("Bet amount must be > 0");
    });

    it("Loser cannot claim reward", async function () {
      await market.startRound();
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1.0") }); // UP
      await market.connect(user2).placeBet(1, 1, { value: ethers.parseEther("1.0") }); // DOWN

      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.lockRound(1);

      // Set higher price -> UP wins
      await oracle.setPrice(feedId, 5000000, -6);
      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.resolveRound(1);

      // User2 (DOWN) tries to claim
      await expect(
        market.connect(user2).claimReward(1)
      ).to.be.revertedWith("No winning bet found");
    });

    it("Double-claim attack is strictly blocked (Replay / Drain prevention)", async function () {
      await market.startRound();
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1.0") });
      await market.connect(user2).placeBet(1, 1, { value: ethers.parseEther("1.0") });

      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.lockRound(1);

      await oracle.setPrice(feedId, 5000000, -6);
      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.resolveRound(1);

      // User1 claims reward once
      await expect(market.connect(user1).claimReward(1)).to.emit(market, "RewardClaimed");

      // User1 tries to claim again
      await expect(
        market.connect(user1).claimReward(1)
      ).to.be.revertedWith("Reward already claimed");
    });

    it("Non-participant cannot claim reward", async function () {
      await market.startRound();
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1.0") });

      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.lockRound(1);

      await oracle.setPrice(feedId, 5000000, -6);
      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.resolveRound(1);

      await expect(
        market.connect(attacker).claimReward(1)
      ).to.be.revertedWith("No winning bet found");
    });

    it("Proportional distribution math handles multiple winners without precision loss", async function () {
      await market.startRound();
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1.0") });
      await market.connect(user2).placeBet(1, 0, { value: ethers.parseEther("3.0") });
      await market.connect(attacker).placeBet(1, 1, { value: ethers.parseEther("4.0") });

      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.lockRound(1);

      await oracle.setPrice(feedId, 5000000, -6); // UP wins
      await ethers.provider.send("evm_increaseTime", [roundDuration + 1]);
      await ethers.provider.send("evm_mine", []);
      await market.resolveRound(1);

      const balBefore1 = await ethers.provider.getBalance(user1.address);
      const tx1 = await market.connect(user1).claimReward(1);
      const receipt1 = await tx1.wait();
      const gas1 = receipt1.gasUsed * receipt1.gasPrice;
      const balAfter1 = await ethers.provider.getBalance(user1.address);

      expect(balAfter1 - balBefore1 + gas1).to.equal(ethers.parseEther("2.0"));

      const balBefore2 = await ethers.provider.getBalance(user2.address);
      const tx2 = await market.connect(user2).claimReward(1);
      const receipt2 = await tx2.wait();
      const gas2 = receipt2.gasUsed * receipt2.gasPrice;
      const balAfter2 = await ethers.provider.getBalance(user2.address);

      expect(balAfter2 - balBefore2 + gas2).to.equal(ethers.parseEther("6.0"));

      // Contract balance should now be exactly 0
      expect(await ethers.provider.getBalance(await market.getAddress())).to.equal(0n);
    });
  });

  describe("5. Parallel Slot Invariance (Isolated State)", function () {
    it("Multiple bets from same user in same round accumulate cleanly in isolated slot", async function () {
      await market.startRound();
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1.0") });
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("2.5") });

      const pos = await market.positions(1, user1.address, 0);
      expect(pos.amount).to.equal(ethers.parseEther("3.5"));
      expect(pos.claimed).to.equal(false);
    });
  });
});
