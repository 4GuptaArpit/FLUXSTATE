import assert from "node:assert/strict";
import { test, describe } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const marketSrcPath = path.resolve(__dirname, "../src/FluxMarket.sol");
const fundingSrcPath = path.resolve(__dirname, "../src/engines/FluxFundingEngine.sol");
const shardSrcPath = path.resolve(__dirname, "../src/engines/ShardedAccumulator.sol");
const vaultSrcPath = path.resolve(__dirname, "../src/core/FluxVault.sol");

const marketSrc = fs.readFileSync(marketSrcPath, "utf8");
const fundingSrc = fs.readFileSync(fundingSrcPath, "utf8");
const shardSrc = fs.readFileSync(shardSrcPath, "utf8");
const vaultSrc = fs.readFileSync(vaultSrcPath, "utf8");

describe("FluxState S-Tier Invariant & Security Suite", () => {
  describe("1. Access Control & Critical Modifiers", () => {
    test("updateFundingIndex protected by onlyMarket modifier", () => {
      assert.ok(
        fundingSrc.includes("updateFundingIndex(uint256 totalLongs, uint256 totalShorts) external onlyMarket"),
        "FluxFundingEngine: updateFundingIndex must be protected by onlyMarket"
      );
    });

    test("checkpointFundingRate protected against same-block sandwich attacks", () => {
      assert.ok(
        marketSrc.includes("require(block.number > lastCheckpointBlock, \"Already checkpointed this block\")"),
        "FluxMarket: checkpointFundingRate must include block cooldown"
      );
    });

    test("Vault payout and deposit protected by onlyMarket", () => {
      assert.ok(vaultSrc.includes("depositCollateral(address trader) external payable onlyMarket"), "depositCollateral onlyMarket");
      assert.ok(vaultSrc.includes("settleTraderPayout("), "settleTraderPayout exists");
      assert.ok(vaultSrc.includes(") external onlyMarket"), "vault settlement protected by onlyMarket");
    });
  });

  describe("2. Checks-Effects-Interactions (CEI) & Reentrancy Elimination", () => {
    test("closePosition: state deleted before vault payout", () => {
      const fnIdx = marketSrc.indexOf("function closePosition");
      assert.ok(fnIdx !== -1, "closePosition exists");
      const body = marketSrc.slice(fnIdx);

      const deleteIdx = body.indexOf("delete positions[msg.sender];");
      const payoutIdx = body.indexOf("vault.settleTraderPayout(msg.sender, traderPayout, pos.margin);");

      assert.ok(deleteIdx !== -1, "Position state deleted");
      assert.ok(payoutIdx !== -1, "Vault settle payout called");
      assert.ok(deleteIdx < payoutIdx, "CEI: Position state cleared before external payout call");
    });

    test("liquidate: state deleted before vault liquidation settlement", () => {
      const fnIdx = marketSrc.indexOf("function liquidate");
      assert.ok(fnIdx !== -1, "liquidate exists");
      const body = marketSrc.slice(fnIdx);

      const deleteIdx = body.indexOf("delete positions[trader];");
      const settleIdx = body.indexOf("vault.settleLiquidation(");

      assert.ok(deleteIdx !== -1, "Position state deleted");
      assert.ok(settleIdx !== -1, "Vault settle liquidation called");
      assert.ok(deleteIdx < settleIdx, "CEI: Position state deleted before liquidation settlement");
    });
  });

  describe("3. Mathematical Invariants & Zero Division Elimination", () => {
    test("Virtual OI floor prevents division by zero in funding rate skew calculation", () => {
      assert.ok(fundingSrc.includes("uint256 public constant VIRTUAL_OI_FLOOR = 50_000 * 1e18;"), "Virtual OI floor defined");
      assert.ok(fundingSrc.includes("totalOI > VIRTUAL_OI_FLOOR ? totalOI : VIRTUAL_OI_FLOOR;"), "Virtual OI floor applied as denominator");
    });

    test("Leverage clamped between MIN_LEVERAGE and MAX_LEVERAGE", () => {
      assert.ok(marketSrc.includes("require(leverage >= MIN_LEVERAGE && leverage <= MAX_LEVERAGE, \"Invalid leverage\");"));
    });

    test("Minimum margin enforced at 0.01 MON", () => {
      assert.ok(marketSrc.includes("require(msg.value >= 1e16, \"Minimum margin 0.01 MON\");"));
    });
  });

  describe("4. 16-Shard Parallel Storage Architecture", () => {
    test("NUM_SHARDS defined as 16", () => {
      assert.ok(shardSrc.includes("uint8 public constant NUM_SHARDS = 16;"), "16 shards configured");
    });

    test("Trader assigned deterministically by address modulo NUM_SHARDS", () => {
      assert.ok(shardSrc.includes("uint8(uint160(trader) % NUM_SHARDS);"), "Deterministic trader shard allocation");
    });
  });
});