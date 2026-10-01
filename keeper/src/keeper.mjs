import { createPublicClient, createWalletClient, http, parseAbi, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Define Monad Testnet Chain
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] }
  },
  testnet: true
};

// 1. Resolve Contract Address from deployed_addresses.json
let MARKET_ADDR = process.env.MARKET_CONTRACT_ADDRESS;
try {
  const manifestPath = path.resolve('../deployed_addresses.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.market) {
      MARKET_ADDR = manifest.market;
    }
  }
} catch (e) {
  console.warn('Could not read deployed_addresses.json, using fallback.');
}
if (!MARKET_ADDR) {
  MARKET_ADDR = '0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5';
}

// 2. Resolve Keeper Account
const KEEPER_KEY = process.env.KEEPER_PRIVATE_KEY || process.env.PRIVATE_KEY;
if (!KEEPER_KEY) {
  console.error("FATAL: Neither KEEPER_PRIVATE_KEY nor PRIVATE_KEY is defined in environment.");
  process.exit(1);
}
const account = privateKeyToAccount(KEEPER_KEY);

const transport = http(monadTestnet.rpcUrls.default.http[0]);
const publicClient = createPublicClient({ chain: monadTestnet, transport });
const walletClient = createWalletClient({ account, chain: monadTestnet, transport });

const MARKET_ABI = parseAbi([
  'function checkpointFundingRate() external',
  'function aggregateTotalOI() view returns (uint256 totalLongs, uint256 totalShorts)',
  'function positions(address) view returns (uint128 margin, uint128 size, uint128 entryPrice, int128 entryFundingIndex, uint32 lastUpdatedBlock, bool isLong, bool isActive)'
]);

console.log('====================================================');
console.log('⚡ FLUXSTATE AUTONOMOUS KEEPER DAEMON');
console.log('====================================================');
console.log('Network         : Monad Testnet (Chain ID 10143)');
console.log('Keeper Address  :', account.address);
console.log('Market Contract :', MARKET_ADDR);
console.log('Cadence         : Every 3 Seconds (Block-by-Block Funding)');
console.log('====================================================\n');

let isProcessing = false;
let checkpointCount = 0;

export async function runKeeperCycle() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const blockNumber = await publicClient.getBlockNumber();
    const balance = await publicClient.getBalance({ address: account.address });

    console.log(`[BLOCK #${blockNumber}] Keeper Heartbeat | Balance: ${parseFloat(formatEther(balance)).toFixed(4)} MON`);

    // 1. Read Total Open Interest across all 16 isolated storage shards
    const [totalLongs, totalShorts] = await publicClient.readContract({
      address: MARKET_ADDR,
      abi: MARKET_ABI,
      functionName: 'aggregateTotalOI'
    });

    console.log(`  └─ Shard Matrix OI: Longs = ${formatEther(totalLongs)} MON | Shorts = ${formatEther(totalShorts)} MON`);

    // 2. Broadcast onchain checkpoint to update continuous funding index
    console.log('  └─ Submitting checkpointFundingRate()...');
    const hash = await walletClient.writeContract({
      address: MARKET_ADDR,
      abi: MARKET_ABI,
      functionName: 'checkpointFundingRate'
    });

    checkpointCount++;
    console.log(`  ✓ Checkpoint #${checkpointCount} mined! Tx Hash: ${hash}`);
  } catch (err) {
    if (err.message && err.message.includes('Already configured')) {
      // transient state
    } else {
      console.warn('  ⚠️ Keeper cycle warning:', err.shortMessage || err.message);
    }
  } finally {
    isProcessing = false;
  }
}

// Execute initial heartbeat and run every 3 seconds continuously
runKeeperCycle();
const interval = setInterval(runKeeperCycle, 3000);

process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\nKeeper daemon terminated cleanly.');
  process.exit(0);
});
