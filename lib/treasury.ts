
import "server-only";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnetInfo } from "./monad-tokens";

const account = privateKeyToAccount(process.env.TREASURY_PRIVATE_KEY as `0x${string}`);

export const treasuryClient = createWalletClient({
  account,
  chain: monadTestnetInfo,
  transport: http(),
});