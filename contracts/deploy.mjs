import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const rpcUrl = process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.log("No PRIVATE_KEY provided in .env. Skipping broadcast, artifacts ready for deployment.");
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Deploying from address:", wallet.address);

  const oracleArtifact = JSON.parse(fs.readFileSync("./artifacts/src/MockPriceOracle.sol/MockPriceOracle.json", "utf8"));
  const marketArtifact = JSON.parse(fs.readFileSync("./artifacts/src/FluxMarket.sol/FluxMarket.json", "utf8"));

  // Deploy Oracle
  console.log("Deploying MockPriceOracle...");
  const OracleFactory = new ethers.ContractFactory(oracleArtifact.abi, oracleArtifact.bytecode, wallet);
  const oracle = await OracleFactory.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("MockPriceOracle deployed at:", oracleAddress);

  // Feed ID for MON/USD
  const monFeedId = ethers.encodeBytes32String("MON/USD");

  // Deploy FluxMarket (10-second micro-rounds)
  console.log("Deploying FluxMarket...");
  const MarketFactory = new ethers.ContractFactory(marketArtifact.abi, marketArtifact.bytecode, wallet);
  const market = await MarketFactory.deploy(oracleAddress, monFeedId, 10);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("FluxMarket deployed at:", marketAddress);

  const deploymentInfo = {
    network: "monadTestnet",
    chainId: 10143,
    oracle: oracleAddress,
    market: marketAddress,
    feedId: monFeedId,
    roundDuration: 10,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync("../deployed_addresses.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment manifest written to ../deployed_addresses.json");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
