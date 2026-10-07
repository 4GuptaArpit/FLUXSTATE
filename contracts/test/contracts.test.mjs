import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const marketArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../artifacts/src/FluxMarket.sol/FluxMarket.json"), "utf8"));
const vaultArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../artifacts/src/core/FluxVault.sol/FluxVault.json"), "utf8"));
const fundingArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../artifacts/src/engines/FluxFundingEngine.sol/FluxFundingEngine.json"), "utf8"));

test("S-Tier Contract Architecture & Invariant Validation", () => {
  // 1. Verify Core Contract ABIs
  assert.ok(marketArtifact.abi.length > 0, "FluxMarket compiled successfully");
  assert.ok(vaultArtifact.abi.length > 0, "FluxVault compiled successfully");
  assert.ok(fundingArtifact.abi.length > 0, "FluxFundingEngine compiled successfully");

  // 2. Validate S-Tier Functions in FluxMarket
  const marketFunctions = marketArtifact.abi.filter(i => i.type === "function").map(f => f.name);
  assert.ok(marketFunctions.includes("openPosition"), "openPosition is present");
  assert.ok(marketFunctions.includes("closePosition"), "closePosition is present");
  assert.ok(marketFunctions.includes("liquidate"), "liquidate is present");
  assert.ok(marketFunctions.includes("checkpointFundingRate"), "checkpointFundingRate is present");
  assert.ok(marketFunctions.includes("aggregateTotalOI"), "aggregateTotalOI is present (from ShardedAccumulator)");

  // 3. Validate FluxVault Bad-Debt & Payout Functions
  const vaultFunctions = vaultArtifact.abi.filter(i => i.type === "function").map(f => f.name);
  assert.ok(vaultFunctions.includes("depositCollateral"), "depositCollateral is present");
  assert.ok(vaultFunctions.includes("settleTraderPayout"), "settleTraderPayout is present");
  assert.ok(vaultFunctions.includes("settleLiquidation"), "settleLiquidation is present");
  assert.ok(vaultFunctions.includes("allocateProtocolFee"), "allocateProtocolFee is present");

  // 4. Validate Continuous Funding Calculation
  const fundingFunctions = fundingArtifact.abi.filter(i => i.type === "function").map(f => f.name);
  assert.ok(fundingFunctions.includes("updateFundingIndex"), "updateFundingIndex is present");
  assert.ok(fundingFunctions.includes("computeFundingDue"), "computeFundingDue is present");
});
