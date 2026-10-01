import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const marketArtifactPath = path.resolve(__dirname, "../artifacts/src/FluxMarket.sol/FluxMarket.json");
const fundingArtifactPath = path.resolve(__dirname, "../artifacts/src/engines/FluxFundingEngine.sol/FluxFundingEngine.json");
const vaultArtifactPath = path.resolve(__dirname, "../artifacts/src/core/FluxVault.sol/FluxVault.json");

const marketArtifact = JSON.parse(fs.readFileSync(marketArtifactPath, "utf8"));
const fundingArtifact = JSON.parse(fs.readFileSync(fundingArtifactPath, "utf8"));
const vaultArtifact = JSON.parse(fs.readFileSync(vaultArtifactPath, "utf8"));

test("FluxMarket - Track 01 Block-by-Block Continuous Funding ABI Verification", () => {
  assert.ok(marketArtifact.abi.length > 0, "FluxMarket ABI compiled");
  assert.ok(fundingArtifact.abi.length > 0, "FluxFundingEngine ABI compiled");
  assert.ok(vaultArtifact.abi.length > 0, "FluxVault ABI compiled");

  const marketFunctions = marketArtifact.abi.filter(i => i.type === "function").map(f => f.name);
  
  // Track 01 Architecture Core Functions
  assert.ok(marketFunctions.includes("openPosition"), "openPosition is present");
  assert.ok(marketFunctions.includes("closePosition"), "closePosition is present");
  assert.ok(marketFunctions.includes("liquidate"), "liquidate is present");
  assert.ok(marketFunctions.includes("checkpointFundingRate"), "checkpointFundingRate is present");
  assert.ok(marketFunctions.includes("aggregateTotalOI"), "aggregateTotalOI is present (ShardedAccumulator)");

  const fundingFunctions = fundingArtifact.abi.filter(i => i.type === "function").map(f => f.name);
  assert.ok(fundingFunctions.includes("updateFundingIndex"), "updateFundingIndex is present");
  assert.ok(fundingFunctions.includes("computeFundingDue"), "computeFundingDue is present");

  const vaultFunctions = vaultArtifact.abi.filter(i => i.type === "function").map(f => f.name);
  assert.ok(vaultFunctions.includes("depositCollateral"), "depositCollateral is present");
  assert.ok(vaultFunctions.includes("settleTraderPayout"), "settleTraderPayout is present");
  assert.ok(vaultFunctions.includes("settleLiquidation"), "settleLiquidation is present");
});