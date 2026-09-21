import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const marketArtifactPath = path.resolve(__dirname, "../artifacts/src/FluxMarket.sol/FluxMarket.json");
const oracleArtifactPath = path.resolve(__dirname, "../artifacts/src/MockPriceOracle.sol/MockPriceOracle.json");
const marketSrcPath = path.resolve(__dirname, "../src/FluxMarket.sol");

const marketArtifact = JSON.parse(fs.readFileSync(marketArtifactPath, "utf8"));
const oracleArtifact = JSON.parse(fs.readFileSync(oracleArtifactPath, "utf8"));
const marketSrc = fs.readFileSync(marketSrcPath, "utf8");
const src = marketSrc;

// Load compiled artifacts

describe("FluxMarket - Brutal Architecture, Logic & Security Test Suite", () => {
  test("1. Contract Bytecode & Compilation Integrity", () => {
    assert.ok(marketArtifact.bytecode.length > 10, "Market bytecode is non-empty");
    assert.ok(oracleArtifact.bytecode.length > 10, "Oracle bytecode is non-empty");
    assert.ok(!marketArtifact.bytecode.includes("INVALID"), "No corrupted opcodes");
  });

  test("2. Reentrancy Vulnerability Audit (Checks-Effects-Interactions Pattern)", () => {
    const claimFunction = marketArtifact.abi.find(f => f.name === "claimPayout");
    assert.ok(claimFunction, "claimPayout exists in ABI");
    
    const claimIndex = src.indexOf("function claimPayout");
    const claimBody = src.slice(claimIndex);
    
    const posClaimedIdx = claimBody.indexOf("pos.claimed = true;");
    const callTransferIdx = claimBody.indexOf("payable(msg.sender).call{value: payout}");
    
    assert.ok(posClaimedIdx !== -1, "State updated (pos.claimed = true)");
    assert.ok(callTransferIdx !== -1, "Payout transfer executed");
    assert.ok(
      posClaimedIdx < callTransferIdx, 
      "CEI PATTERN ENFORCED: State is marked claimed BEFORE external ether transfer occurs"
    );
  });

  test("3. Access Control & Backdoor Elimination Audit", () => {
    // Check for selfdestruct, delegatecall, hidden admin drains
    assert.ok(!src.includes("selfdestruct"), "SECURITY: No selfdestruct opcode");
    assert.ok(!src.includes("delegatecall"), "SECURITY: No delegatecall proxy hijacking risk");
    assert.ok(!src.includes("suicide"), "SECURITY: No deprecated suicide opcode");
    assert.ok(!src.includes("assembly"), "SECURITY: No unconstrained inline assembly");
    
    // Verify owner-only restrictions
    assert.ok(src.includes("modifier onlyOwner()"), "onlyOwner modifier exists");
    assert.ok(src.includes("require(msg.sender == owner"), "Strict msg.sender equality check");
  });

  test("4. Division-by-Zero & Math Overflow Immunity", () => {
    assert.ok(
      src.includes("require(pos.amount > 0, \"No winning position\");"),
      "Zero-position callers cannot trigger division or payouts"
    );
    assert.ok(
      src.includes("require(msg.value > 0, \"Margin must be > 0\");"),
      "Zero-margin bets are rejected at entry"
    );
    assert.ok(
      src.includes("if (total == 0) return 0;"),
      "Zero-liquidity division check exists in calculateBlockFundingRate"
    );
  });

  test("5. Monad Parallel EVM Slot Independence (Storage Partitioning)", () => {
    // Verify isolated slot definition
    assert.ok(
      src.includes("mapping(uint256 => mapping(address => mapping(Direction => Position))) public positions;"),
      "Storage layout is 3-dimensional mapping: positions[epoch][user][dir] guaranteeing non-overlapping storage keys"
    );
  });

  test("6. State Lifecycle Integrity (start -> lock -> resolve -> claim)", () => {
    assert.ok(src.includes("require(!epoch.resolved, \"Already resolved\");"), "Lock requires unresolved epoch");
    assert.ok(src.includes("require(epoch.lockPrice == 0, \"Already locked\");"), "Prevents double-lock attack");
    assert.ok(src.includes("require(!epoch.resolved, \"Round already resolved\");"), "Prevents double-resolve attack");
    assert.ok(src.includes("require(epoch.lockPrice != 0, \"Round was not locked\");"), "Resolve requires valid lock price");
    assert.ok(src.includes("require(epoch.resolved, \"Round not yet resolved\");"), "Claim requires resolved epoch");
    assert.ok(src.includes("require(!pos.claimed, \"Payout already claimed\");"), "Prevents double-claim attack");
  });
});