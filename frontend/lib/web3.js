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
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
};

export const CONTRACT_ADDRESSES = {
  market: process.env.NEXT_PUBLIC_MARKET_ADDRESS || "0xca45eee4bEc9B4dE2fFCD82C6d36eFB524A02176",
  oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || "0x9438B88C0BcF1dD58AA0F86D5C1a7761b5D39AAC",
  markets: {
    "MON/USD": process.env.NEXT_PUBLIC_MARKET_MON || "0xca45eee4bEc9B4dE2fFCD82C6d36eFB524A02176",
    "ETH/USD": process.env.NEXT_PUBLIC_MARKET_ETH || "0x786e11A957677c8A17F08Db2cA75C7ABDA127E6C",
    "BTC/USD": process.env.NEXT_PUBLIC_MARKET_BTC || "0xaaeE42E6988C5A90Fe3Cd3FE91d23efC15e7Fe17"
  }
};

export const FLUX_MARKET_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "epochId", type: "uint256" },
      { internalType: "uint8", name: "direction", type: "uint8" }
    ],
    name: "openPosition",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "epochId", type: "uint256" }],
    name: "calculateBlockFundingRate",
    outputs: [{ internalType: "int256", name: "", type: "int256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "epochId", type: "uint256" }],
    name: "claimPayout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "currentEpochId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "epochs",
    outputs: [
      { internalType: "uint256", name: "startTimestamp", type: "uint256" },
      { internalType: "uint256", name: "lockTimestamp", type: "uint256" },
      { internalType: "uint256", name: "closeTimestamp", type: "uint256" },
      { internalType: "int64", name: "lockPrice", type: "int64" },
      { internalType: "int64", name: "closePrice", type: "int64" },
      { internalType: "uint256", name: "totalLongAmount", type: "uint256" },
      { internalType: "uint256", name: "totalShortAmount", type: "uint256" },
      { internalType: "int256", name: "blockFundingRateBps", type: "int256" },
      { internalType: "bool", name: "resolved", type: "bool" },
      { internalType: "uint8", name: "winningDirection", type: "uint8" }
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
