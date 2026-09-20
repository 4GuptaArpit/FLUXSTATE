import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const MARKETS = [
  { symbol: "MON/USD", feed: "MON/USD", initialPrice: 428500000, decimals: -8 },
  { symbol: "ETH/USD", feed: "ETH/USD", initialPrice: 345025000000, decimals: -8 },
  { symbol: "BTC/USD", feed: "BTC/USD", initialPrice: 8850075000000, decimals: -8 }
];

async function main() {
  const rpcUrl = process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.log("No PRIVATE_KEY provided in contracts/.env. Skipping broadcast.");
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Deploying multi-market architecture from:", wallet.address);

  const oracleArtifact = JSON.parse(fs.readFileSync("./artifacts/src/MockPriceOracle.sol/MockPriceOracle.json", "utf8"));
  const marketArtifact = JSON.parse(fs.readFileSync("./artifacts/src/FluxMarket.sol/FluxMarket.json", "utf8"));

  console.log("Deploying Shared MockPriceOracle...");
  const OracleFactory = new ethers.ContractFactory(oracleArtifact.abi, oracleArtifact.bytecode, wallet);
  const oracle = await OracleFactory.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("Shared Oracle deployed at:", oracleAddress);

  const deployedMarkets = {};

  for (const m of MARKETS) {
    console.log(`Setting initial price feed for ${m.symbol}...`);
    const feedId = ethers.encodeBytes32String(m.feed);
    const txPrice = await oracle.setPrice(feedId, m.initialPrice, m.decimals);
    await txPrice.wait(1);

    console.log(`Deploying FluxMarket for ${m.symbol}...`);
    const MarketFactory = new ethers.ContractFactory(marketArtifact.abi, marketArtifact.bytecode, wallet);
    const market = await MarketFactory.deploy(oracleAddress, feedId, 10);
    await market.waitForDeployment();
    const marketAddress = await market.getAddress();
    console.log(`FluxMarket [${m.symbol}] deployed at: ${marketAddress}`);

    deployedMarkets[m.symbol] = {
      marketAddress,
      feedId,
      symbol: m.symbol
    };
  }

  const deploymentInfo = {
    network: "monadTestnet",
    chainId: 10143,
    oracle: oracleAddress,
    markets: deployedMarkets,
    roundDuration: 10,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync("../deployed_addresses.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("Multi-market manifest written to ../deployed_addresses.json");
}

main().catch((error) => {
  console.error("Multi-market deployment failed:", error);
  process.exit(1);
});
