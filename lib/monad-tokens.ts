import { defineChain } from "viem";

export const monadTestnetInfo = defineChain({
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadscan.com",
    },
  },
  testnet: true,
});

export const AUSD_ADDRESS = "0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC" as const;

export const TOKENS = {
  MON: {
    symbol: "MON",
    name: "Monad",
    address: "0x0000000000000000000000000000000000000000" as const, 
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/monad-crypto/token-list/refs/heads/main/mainnet/MON/logo.svg",
    isNative: true,
  },
  USDC: {
    symbol: "USDC",
    name: "USDC",
    address: "0x534b2f3A21130d7a60830c2Df862319e593943A3" as const,
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/monad-crypto/token-list/refs/heads/main/mainnet/USDC/logo.svg",
    isNative: false,
  },
  AUSD: {
    symbol: "AUSD",
    name: "Agora USD",
    address: "0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC" as const,
    decimals: 6,
    logoURI: "",
    isNative: false,
  },
} as const;

export type TokenSymbol = keyof typeof TOKENS;