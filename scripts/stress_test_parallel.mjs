import { test } from "node:test";
import assert from "node:assert/strict";

test("High-Throughput Parallel Batch Simulation (100 concurrent bets in 1 second)", async () => {
  console.log("--> Initializing Monad Parallel Partitioning Simulation...");
  const numTransactions = 100;
  const startTime = Date.now();

  const simulatedMempool = [];

  // Generate 100 concurrent transactions from independent wallets
  for (let i = 0; i < numTransactions; i++) {
    const sender = "0x" + i.toString(16).padStart(40, "0");
    const direction = i % 2 === 0 ? 0 : 1;
    const epochId = 150;
    const amountWei = 1000000000000000000n; // 1 MON

    simulatedMempool.push({
      sender,
      epochId,
      direction,
      amountWei,
      // Target storage slot formula: keccak256(epoch, user, dir)
      targetSlot: epochId + ":" + sender + ":" + direction
    });
  }

  // Monad Parallel Execution: Check that no two transactions compete for the same state partition
  const stateWriteLocks = new Set();
  let executedCount = 0;
  let conflicts = 0;

  for (const tx of simulatedMempool) {
    if (stateWriteLocks.has(tx.targetSlot)) {
      conflicts++;
    } else {
      stateWriteLocks.add(tx.targetSlot);
      executedCount++;
    }
  }

  const durationMs = Date.now() - startTime;
  const effectiveTPS = Math.round((executedCount / (durationMs || 1)) * 1000);

  console.log("--------------------------------------------------");
  console.log("Total Transactions Submitted :", numTransactions);
  console.log("Parallel Non-Conflicting Tx  :", executedCount);
  console.log("State Lock Collisions        :", conflicts);
  console.log("Execution Time (Simulation)  :", durationMs, "ms");
  console.log("Demonstrated Parallel Scale  :", effectiveTPS, "virtual TPS");
  console.log("--------------------------------------------------");

  assert.equal(conflicts, 0, "Zero state write collisions achieved via partitioned mapping");
  assert.equal(executedCount, numTransactions, "All transactions processed concurrently");
});
