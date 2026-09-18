import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

/**
 * Autonomous Keeper Bot for FluxState
 * Cycles high-frequency rounds:
 * 1. startRound()
 * 2. Push real-time simulated price ticks to MockPriceOracle
 * 3. lockRound(epochId)
 * 4. resolveRound(epochId)
 */
async function runKeeper() {
  const rpcUrl = process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
  const privateKey = process.env.PRIVATE_KEY;

  console.log("==================================================");
  console.log("⚡ FluxState Autonomous Keeper Bot (Monad Parallel EVM)");
  console.log("==================================================");

  if (!privateKey) {
    console.log("⚠️ No PRIVATE_KEY configured in environment.");
    console.log("Keeper is running in SIMULATED TELEMETRY mode for local benchmarks & demo.");
    
    let epoch = 150;
    let basePrice = 428500000; // $4.285 with 8 decimals

    setInterval(() => {
      epoch++;
      const delta = (Math.random() - 0.49) * 250000;
      basePrice = Math.round(basePrice + delta);
      const formattedPrice = (basePrice / 100000000).toFixed(3);
      const winner = Math.random() > 0.48 ? "UP" : "DOWN";

      console.log(`[EPOCH #${epoch}] START -> LOCK -> RESOLVED (${winner}) | Price: $${formattedPrice} | 1.0s Monad Block Finality`);
    }, 5000);

    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Keeper wallet:", wallet.address);

  // Load deployment addresses
  let deployedAddresses;
  try {
    deployedAddresses = JSON.parse(fs.readFileSync("./deployed_addresses.json", "utf8"));
  } catch (err) {
    console.error("Could not read deployed_addresses.json. Deploy contracts first!");
    return;
  }

  const oracleArtifact = JSON.parse(fs.readFileSync("./artifacts/src/MockPriceOracle.sol/MockPriceOracle.json", "utf8"));
  const marketArtifact = JSON.parse(fs.readFileSync("./artifacts/src/FluxMarket.sol/FluxMarket.json", "utf8"));

  const oracle = new ethers.Contract(deployedAddresses.oracle, oracleArtifact.abi, wallet);
  const market = new ethers.Contract(deployedAddresses.market, marketArtifact.abi, wallet);

  console.log("Active Market:", deployedAddresses.market);
  console.log("Active Oracle:", deployedAddresses.oracle);

  const roundDuration = Number(await market.roundDuration()) || 10;
  console.log(`Round duration configured to: ${roundDuration} seconds.`);

  async function cycleRound() {
    try {
      console.log("\n[KEEPER] Triggering startRound()...");
      const txStart = await market.startRound();
      await txStart.wait(1);
      const currentEpoch = await market.currentEpochId();
      console.log(`✓ Round #${currentEpoch} STARTED! Window open for bets.`);

      // Wait round duration for bets to accumulate
      await new Promise(r => setTimeout(r, roundDuration * 1000));

      // Push price tick to oracle
      const simulatedPrice = Math.round((4.28 + (Math.random() - 0.49) * 0.05) * 100000000);
      console.log(`[KEEPER] Pushing Pyth price tick to Oracle: $${(simulatedPrice / 100000000).toFixed(3)}`);
      const txPrice = await oracle.setPrice(deployedAddresses.feedId, simulatedPrice, -8);
      await txPrice.wait(1);

      console.log(`[KEEPER] Locking round #${currentEpoch}...`);
      const txLock = await market.lockRound(currentEpoch);
      await txLock.wait(1);
      console.log(`✓ Round #${currentEpoch} LOCKED!`);

      // Wait round duration for outcome to manifest
      await new Promise(r => setTimeout(r, roundDuration * 1000));

      console.log(`[KEEPER] Resolving round #${currentEpoch}...`);
      const txResolve = await market.resolveRound(currentEpoch);
      await txResolve.wait(1);
      console.log(`✓ Round #${currentEpoch} RESOLVED ONCHAIN!`);

    } catch (error) {
      console.error("Keeper loop encountered error:", error.message || error);
    }
  }

  // Loop every (roundDuration * 2 + 2) seconds
  while (true) {
    await cycleRound();
  }
}

runKeeper().catch(console.error);
