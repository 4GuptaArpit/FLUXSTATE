import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from "viem";

export const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "MonadScan",
      url: "https://testnet.monadscan.com",
    },
  },
  testnet: true,
};

export const CONTRACT_ADDRESSES = {
  market: process.env.NEXT_PUBLIC_MARKET_ADDRESS || "0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5",
  oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || "0xc547C6f06495690cEd525EDd8Eaf4C17484b0C39",
  markets: {
    "MON/USD": process.env.NEXT_PUBLIC_MARKET_MON || "0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5",
    "ETH/USD": process.env.NEXT_PUBLIC_MARKET_ETH || "0x786e11A957677c8A17F08Db2cA75C7ABDA127E6C",
    "BTC/USD": process.env.NEXT_PUBLIC_MARKET_BTC || "0xaaeE42E6988C5A90Fe3Cd3FE91d23efC15e7Fe17"
  }
};

export const FLUX_MARKET_ABI = [
  {
    inputs: [
      { internalType: "bool", name: "isLong", type: "bool" },
      { internalType: "uint256", name: "leverage", type: "uint256" },
      { internalType: "uint256", name: "maxPriceSlippage", type: "uint256" },
      { internalType: "bytes[]", name: "pythPriceUpdate", type: "bytes[]" }
    ],
    name: "openPosition",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "minPriceSlippage", type: "uint256" },
      { internalType: "bytes[]", name: "pythPriceUpdate", type: "bytes[]" }
    ],
    name: "closePosition",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "positions",
    outputs: [
      { internalType: "uint128", name: "margin", type: "uint128" },
      { internalType: "uint128", name: "size", type: "uint128" },
      { internalType: "uint128", name: "entryPrice", type: "uint128" },
      { internalType: "int128", name: "entryFundingIndex", type: "int128" },
      { internalType: "uint32", name: "lastUpdatedBlock", type: "uint32" },
      { internalType: "bool", name: "isLong", type: "bool" },
      { internalType: "bool", name: "isActive", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "checkpointFundingRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "aggregateTotalOI",
    outputs: [
      { internalType: "uint256", name: "totalLongOI", type: "uint256" },
      { internalType: "uint256", name: "totalShortOI", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

export function getPublicClient() {
  return createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });
}

export function getWalletClient() {
  if (typeof window !== "undefined" && window.ethereum) {
    return createWalletClient({
      chain: monadTestnet,
      transport: custom(window.ethereum),
    });
  }
  return null;
}

export async function addMonadTestnetToWallet() {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x279f", // 10143 in hex
          chainName: "Monad Testnet",
          nativeCurrency: {
            name: "Monad",
            symbol: "MON",
            decimals: 18,
          },
          rpcUrls: ["https://testnet-rpc.monad.xyz"],
          blockExplorerUrls: ["https://testnet.monadscan.com"],
        }],
      });
      return true;
    } catch (err) {
      console.error("Failed to add Monad Testnet:", err);
      return false;
    }
  }
  return false;
}
