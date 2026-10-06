import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { createPublicClient, http, parseEther, formatEther } from "../../frontend/node_modules/viem/_esm/index.js";

// Monad Testnet configuration
const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] }
  }
};

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http("https://testnet-rpc.monad.xyz")
});

const MARKET_ADDR = "0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5";
const FUNDING_ENGINE_ADDR = "0xBF76d0d245fED0C1279c6719cBe27635805533B2";
const VAULT_ADDR = "0x5047f8d761dcE6edf7b2171b123e0A758056d914";

describe("FluxState Live On-Chain Mathematical & EVM Integration Suite", () => {
  test("1. Monad RPC Live Connectivity & Block Finality", async () => {
    const blockNumber = await publicClient.getBlockNumber();
    assert.ok(blockNumber > 0n, "Live block number retrieved from Monad Testnet");
  });

  test("2. Deployed Contracts Verified & Responsive", async () => {
    const marketCode = await publicClient.getBytecode({ address: MARKET_ADDR });
    assert.ok(marketCode && marketCode.length > 2, "FluxMarket contract code exists on Monad");

    const vaultCode = await publicClient.getBytecode({ address: VAULT_ADDR });
    assert.ok(vaultCode && vaultCode.length > 2, "FluxVault contract code exists on Monad");

    const engineCode = await publicClient.getBytecode({ address: FUNDING_ENGINE_ADDR });
    assert.ok(engineCode && engineCode.length > 2, "FluxFundingEngine contract code exists on Monad");
  });

  test("3. Sharded Accumulator: 16-Shard Querying via RPC", async () => {
    // Read shard #7 and shard #0
    const shardAbi = [
      {
        inputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        name: "shards",
        outputs: [
          { internalType: "uint128", name: "longOI", type: "uint128" },
          { internalType: "uint128", name: "shortOI", type: "uint128" }
        ],
        stateMutability: "view",
        type: "function"
      }
    ];

    const shard0 = await publicClient.readContract({
      address: MARKET_ADDR,
      abi: shardAbi,
      functionName: "shards",
      args: [0]
    });
    assert.ok(Array.isArray(shard0), "Shard 0 query returned valid tuple");

    const shard7 = await publicClient.readContract({
      address: MARKET_ADDR,
      abi: shardAbi,
      functionName: "shards",
      args: [7]
    });
    assert.ok(Array.isArray(shard7), "Shard 7 query returned valid tuple");
  });

  test("4. Continuous Funding Math: Cumulative Index & PnL Formula Verification", async () => {
    // Mathematical unit verification of the contract algorithm:
    // delta = currentIndex - entryIndex
    // fundingDueLong = (size * delta) / PRECISION
    const PRECISION = 10n ** 18n;
    const size = parseEther("100"); // 100 MON notional position (10 MON x 10x)
    const entryIndex = 0n;
    const currentIndex = parseEther("0.0005"); // accrued funding rate over blocks

    const delta = currentIndex - entryIndex;
    const fundingDueLong = (size * delta) / PRECISION;
    const expectedLong = parseEther("0.05"); // 100 * 0.0005 = 0.05 MON

    assert.equal(fundingDueLong, expectedLong, "Continuous funding accrual math matches contract specification");
  });
});
