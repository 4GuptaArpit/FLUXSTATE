import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";

const marketArtifact = JSON.parse(fs.readFileSync("./artifacts/src/FluxMarket.sol/FluxMarket.json", "utf8"));
const oracleArtifact = JSON.parse(fs.readFileSync("./artifacts/src/MockPriceOracle.sol/MockPriceOracle.json", "utf8"));

test("FluxMarket - Track 01 Block-by-Block Funding & Micro-Perp ABI Verification", async (t) => {
  assert.ok(marketArtifact.abi.length > 0, "FluxMarket ABI compiled");
  assert.ok(oracleArtifact.abi.length > 0, "MockPriceOracle ABI compiled");
  
  const functionNames = marketArtifact.abi.filter(i => i.type === "function").map(f => f.name);
  
  // Verify Track 01 specific methods
  assert.ok(functionNames.includes("calculateBlockFundingRate"), "calculateBlockFundingRate is implemented");
  assert.ok(functionNames.includes("openPosition"), "openPosition is implemented");
  assert.ok(functionNames.includes("startRound"), "startRound is implemented");
  assert.ok(functionNames.includes("lockRound"), "lockRound is implemented");
  assert.ok(functionNames.includes("resolveRound"), "resolveRound is implemented");
  assert.ok(functionNames.includes("claimPayout"), "claimPayout is implemented");
});
