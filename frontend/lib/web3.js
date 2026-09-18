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
  market: process.env.NEXT_PUBLIC_MARKET_ADDRESS || "0x0000000000000000000000000000000000000000",
  oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || "0x0000000000000000000000000000000000000000",
};

export const FLUX_MARKET_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "epochId", type: "uint256" },
      { internalType: "uint8", name: "direction", type: "uint8" }
    ],
    name: "placeBet",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "epochId", type: "uint256" }],
    name: "claimReward",
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
      { internalType: "uint256", name: "totalUpAmount", type: "uint256" },
      { internalType: "uint256", name: "totalDownAmount", type: "uint256" },
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
