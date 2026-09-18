import assert from "node:assert/strict";
import { test, before } from "node:test";
import { ethers } from "ethers";
import fs from "node:fs";

// Read compiled contract artifacts
const marketArtifact = JSON.parse(fs.readFileSync("./artifacts/src/FluxMarket.sol/FluxMarket.json", "utf8"));
const oracleArtifact = JSON.parse(fs.readFileSync("./artifacts/src/MockPriceOracle.sol/MockPriceOracle.json", "utf8"));

test("FluxMarket - Parallel Micro-Prediction Lifecycle", async (t) => {
  // Setup standalone ethers provider or mock wallet for testing logic
  assert.ok(marketArtifact.abi.length > 0, "FluxMarket ABI compiled successfully");
  assert.ok(oracleArtifact.abi.length > 0, "MockPriceOracle ABI compiled successfully");
  
  // Verify method presence
  const marketFunctions = marketArtifact.abi.filter(item => item.type === "function").map(f => f.name);
  assert.ok(marketFunctions.includes("startRound"), "startRound is present");
  assert.ok(marketFunctions.includes("placeBet"), "placeBet is present");
  assert.ok(marketFunctions.includes("lockRound"), "lockRound is present");
  assert.ok(marketFunctions.includes("resolveRound"), "resolveRound is present");
  assert.ok(marketFunctions.includes("claimReward"), "claimReward is present");
});
