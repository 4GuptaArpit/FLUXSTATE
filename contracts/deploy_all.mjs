import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const rpcUrl = process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error("No PRIVATE_KEY provided in .env");
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("==================================================");
  console.log("DEPLOYING FLUXSTATE S-TIER SYSTEM TO MONAD TESTNET");
  console.log("Deployer Address:", wallet.address);
  const startBal = await provider.getBalance(wallet.address);
  console.log("Deployer Balance:", ethers.formatEther(startBal), "MON");
  console.log("==================================================");

  // 1. Read Compiled Artifacts
  const oracleArtifact = JSON.parse(fs.readFileSync("./artifacts/src/MockPriceOracle.sol/MockPriceOracle.json", "utf8"));
  const vaultArtifact = JSON.parse(fs.readFileSync("./artifacts/src/core/FluxVault.sol/FluxVault.json", "utf8"));
  const fundingArtifact = JSON.parse(fs.readFileSync("./artifacts/src/engines/FluxFundingEngine.sol/FluxFundingEngine.json", "utf8"));
  const marketArtifact = JSON.parse(fs.readFileSync("./artifacts/src/FluxMarket.sol/FluxMarket.json", "utf8"));

  // 2. Deploy MockPriceOracle
  console.log("\n1/4 Deploying MockPriceOracle...");
  const OracleFactory = new ethers.ContractFactory(oracleArtifact.abi, oracleArtifact.bytecode, wallet);
  const oracle = await OracleFactory.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✓ MockPriceOracle deployed at:", oracleAddress);

  // 3. Deploy FluxVault
  console.log("\n2/4 Deploying FluxVault...");
  const VaultFactory = new ethers.ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, wallet);
  const vault = await VaultFactory.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✓ FluxVault deployed at:", vaultAddress);

  // Fund the vault with 3 MON initial LP liquidity for paying out trader profits!
  console.log("  Funding FluxVault with 3.0 MON liquidity pool...");
  const fundTx = await wallet.sendTransaction({
    to: vaultAddress,
    value: ethers.parseEther("3.0")
  });
  await fundTx.wait();
  console.log("✓ Vault liquidity seeded with 3.0 MON!");

  // 4. Deploy FluxFundingEngine
  console.log("\n3/4 Deploying FluxFundingEngine...");
  const FundingFactory = new ethers.ContractFactory(fundingArtifact.abi, fundingArtifact.bytecode, wallet);
  const fundingEngine = await FundingFactory.deploy();
  await fundingEngine.waitForDeployment();
  const fundingAddress = await fundingEngine.getAddress();
  console.log("✓ FluxFundingEngine deployed at:", fundingAddress);

  // 5. Deploy FluxMarket (16 Shards)
  console.log("\n4/4 Deploying 16-Shard FluxMarket [MON/USD]...");
  const monFeedId = ethers.encodeBytes32String("MON/USD");
  const MarketFactory = new ethers.ContractFactory(marketArtifact.abi, marketArtifact.bytecode, wallet);
  const market = await MarketFactory.deploy(oracleAddress, monFeedId, fundingAddress, vaultAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("✓ FluxMarket deployed at:", marketAddress);

  // 6. Connect Market to Vault and Funding Engine
  console.log("\nWiring Protocol Permissions...");
  const setMarketTx = await vault.setMarket(marketAddress);
  await setMarketTx.wait();
  console.log("✓ Vault market set to FluxMarket!");

  const setFundingMarketTx = await fundingEngine.setMarketContract(marketAddress);
  await setFundingMarketTx.wait();
  console.log("✓ Funding Engine market set to FluxMarket!");

  // 7. Write deployed addresses manifest
  const deploymentInfo = {
    network: "monadTestnet",
    chainId: 10143,
    oracle: oracleAddress,
    vault: vaultAddress,
    fundingEngine: fundingAddress,
    market: marketAddress,
    feedId: monFeedId,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync("../deployed_addresses.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n==================================================");
  console.log("DEPLOYMENT COMPLETE! Manifest saved to deployed_addresses.json");
  console.log("Market Contract Address:", marketAddress);
  console.log("Vault Contract Address:", vaultAddress);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
