
import "server-only";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepoliaTestnet } from "./sepolia";

const account = privateKeyToAccount(process.env.TREASURY_PRIVATE_KEY as `0x${string}`);

export const treasuryClient = createWalletClient({
  account,
  chain: sepoliaTestnet,
  transport: http(),
});