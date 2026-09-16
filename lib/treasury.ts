
import "server-only";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "./monad";

const account = privateKeyToAccount(process.env.TREASURY_PRIVATE_KEY as `0x${string}`);

export const treasuryClient = createWalletClient({
  account,
  chain: monadTestnet,
  transport: http(),
});