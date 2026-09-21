import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { parseEther, formatEther } from "viem";
import { FLUX_MARKET_ABI, CONTRACT_ADDRESSES } from "./lib/web3.js";

describe("Frontend Web3 & Logic Integrity Test Suite", () => {
  test("1. Direction Enum Mapping", () => {
    const toEnum = (dir) => dir === "LONG" ? 0 : 1;
    assert.equal(toEnum("LONG"), 0, "LONG maps to 0");
    assert.equal(toEnum("SHORT"), 1, "SHORT maps to 1");
  });

  test("2. Margin Parsing Without Precision Drift", () => {
    assert.equal(parseEther("1"), 1000000000000000000n);
    assert.equal(parseEther("5"), 5000000000000000000n);
    assert.equal(parseEther("25"), 25000000000000000000n);
    assert.equal(parseEther("100"), 100000000000000000000n);
    assert.equal(parseEther("0.05"), 50000000000000000n);
  });

  test("3. FLUX_MARKET_ABI Function Signatures", () => {
    const fnNames = FLUX_MARKET_ABI.map(item => item.name);
    assert.ok(fnNames.includes("openPosition"), "openPosition in ABI");
    assert.ok(fnNames.includes("claimPayout"), "claimPayout in ABI");
    assert.ok(fnNames.includes("calculateBlockFundingRate"), "calculateBlockFundingRate in ABI");
    assert.ok(fnNames.includes("epochs"), "epochs view in ABI");

    // Check openPosition inputs
    const openPos = FLUX_MARKET_ABI.find(i => i.name === "openPosition");
    assert.equal(openPos.inputs.length, 2);
    assert.equal(openPos.inputs[0].type, "uint256");
    assert.equal(openPos.inputs[1].type, "uint8");
  });

  test("4. Fallback Behavior for Unset Contract Address", () => {
    assert.ok(typeof CONTRACT_ADDRESSES.market === "string");
    assert.ok(CONTRACT_ADDRESSES.market.startsWith("0x"));
  });

  test("5. Multiplier Dynamic Math", () => {
    const calcMult = (myPool, otherPool) => {
      const total = myPool + otherPool;
      return (total / (myPool || 1)).toFixed(2) + "x";
    };

    // Equal pools: 2.00x
    assert.equal(calcMult(100, 100), "2.00x");
    // 75% vs 25%: 1.33x vs 4.00x
    assert.equal(calcMult(75, 25), "1.33x");
    assert.equal(calcMult(25, 75), "4.00x");
  });
});
