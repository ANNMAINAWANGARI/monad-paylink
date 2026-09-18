
import { defineChain } from "viem";

export const sepoliaTestnet = defineChain({
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] }, 
  },
  blockExplorers: {
    default: { name: "Etherscan-Sepolia", url: "https://sepolia.etherscan.io/" },
  },
});

export const AUSD_ADDRESS = "0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC" as const;

export const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;