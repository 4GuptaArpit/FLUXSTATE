import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

/**
 * Autonomous Multi-Market Keeper Bot for FluxState
 * Drives 3 parallel markets (MON/USD, ETH/USD, BTC/USD) concurrently using Promise.all
 * Showcases Monad parallel execution across state slots
 */
async function runMultiKeeper() {
  const rpcUrl = process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
  const privateKey = process.env.PRIVATE_KEY;

  console.log("===============================================================");
  console.log("⚡ FluxState Multi-Market Parallel Keeper Bot (Monad EVM)");
  console.log("===============================================================");

  if (!privateKey) {
    console.log("⚠️ No PRIVATE_KEY configured in environment.");
    console.log("Keeper is running in SIMULATED TELEMETRY mode for all 3 markets.");

    let round = 100;
    setInterval(() => {
      round++;
      console.log(`[ROUND #${round}] Parallel Settlement -> MON/USD ($4.28) | ETH/USD ($3,450) | BTC/USD ($88,520) - Execution Time: 8.4ms (Monad Parallel)`);
    }, 4000);
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Keeper wallet:", wallet.address);

  let deployedInfo;
  try {
    deployedInfo = JSON.parse(fs.readFileSync("./deployed_addresses.json", "utf8"));
  } catch (err) {
    console.error("Could not read deployed_addresses.json. Run deploy first!");
    return;
  }

  const oracleArtifact = JSON.parse(fs.readFileSync("./contracts/artifacts/src/MockPriceOracle.sol/MockPriceOracle.json", "utf8"));
  const marketArtifact = JSON.parse(fs.readFileSync("./contracts/artifacts/src/FluxMarket.sol/FluxMarket.json", "utf8"));

  const oracle = new ethers.Contract(deployedInfo.oracle, oracleArtifact.abi, wallet);
  const markets = Object.entries(deployedInfo.markets || {}).map(([sym, data]) => ({
    symbol: sym,
    contract: new ethers.Contract(data.marketAddress, marketArtifact.abi, wallet),
    feedId: data.feedId
  }));

  console.log(`Loaded ${markets.length} parallel markets.`);

  async function stepMarket(marketObj) {
    try {
      console.log(`[${marketObj.symbol}] Starting new round...`);
      const txStart = await marketObj.contract.startRound();
      await txStart.wait(1);
      const epoch = await marketObj.contract.currentEpochId();
      console.log(`[${marketObj.symbol}] Round #${epoch} OPEN`);
      return epoch;
    } catch (e) {
      console.warn(`[${marketObj.symbol}] Round start error: ${e.message}`);
    }
  }

  while (true) {
    console.log("
--- Triggering parallel round starts across all markets ---");
    await Promise.all(markets.map(m => stepMarket(m)));
    await new Promise(r => setTimeout(r, 10000));
  }
}

runMultiKeeper().catch(console.error);
