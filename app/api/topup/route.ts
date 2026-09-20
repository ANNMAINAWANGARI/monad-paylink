import { NextResponse } from "next/server";
import { parseUnits ,erc20Abi} from "viem";
import { treasuryClient } from "@/lib/treasury";
import { AUSD_ADDRESS } from "@/lib/monad-tokens";

const AUSD_PER_COIN = 1;


export async function POST(req: Request) {
  const { my_address, coins } = await req.json();

  if (!my_address || !coins) {
    return NextResponse.json({ error: "Missing address or coins" }, { status: 400 });
  }

  const ausdAmount = coins * AUSD_PER_COIN;

  try {
    const hash = await treasuryClient.writeContract({
      address: AUSD_ADDRESS,
      abi: erc20Abi,
      functionName: "transfer",
      args: [my_address, parseUnits(ausdAmount.toString(), 6)], 
    });

    return NextResponse.json({ txHash: hash, ausdAmount });
  } catch (err) {
    console.error("Topup transfer failed", err);
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
  }
}