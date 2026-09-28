import { NextResponse } from 'next/server';
import { createPublicClient, http, parseEventLogs, erc20Abi, formatUnits, type Hex } from 'viem';
import { monadTestnet } from 'viem/chains';
import { AUSD_ADDRESS } from '@/lib/monad-tokens';
import { pusherServer } from '@/lib/pusher-server';
import { liveGoals, liveSeenTx } from '@/lib/live/goalStore';
import { LIVE_CREATOR_ADDRESS } from '@/lib/live/config';

const client = createPublicClient({ chain: monadTestnet, transport: http() });

export async function POST(req: Request) {
  const { streamId, uid, gift, senderId, txHash } = await req.json();
  if (!streamId || !uid || !gift || !txHash) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }
  if (liveSeenTx.has(txHash)) {
    return NextResponse.json({ error: 'already counted' }, { status: 409 });
  }

  let receipt;
  try {
    receipt = await client.waitForTransactionReceipt({ hash: txHash as Hex, timeout: 15_000 });
  } catch {
    return NextResponse.json({ error: 'tx not found' }, { status: 400 });
  }
  if (receipt.status !== 'success') {
    return NextResponse.json({ error: 'tx failed' }, { status: 400 });
  }

  const transfers = parseEventLogs({ abi: erc20Abi, eventName: 'Transfer', logs: receipt.logs });
  const match = transfers.find(
    (l) =>
      l.address.toLowerCase() === AUSD_ADDRESS.toLowerCase() &&
      l.args.to.toLowerCase() === LIVE_CREATOR_ADDRESS.toLowerCase()
  );
  if (!match) {
    return NextResponse.json({ error: 'no AUSD transfer to creator' }, { status: 400 });
  }

  const paid = Number(formatUnits(match.args.value, 6));
  if (paid !== Number(gift.price)) {
    return NextResponse.json({ error: 'amount mismatch' }, { status: 400 });
  }

  liveSeenTx.add(txHash);
  await pusherServer.trigger(`live-${streamId}`, 'gift', { uid, gift, senderId, txHash });

  const goal = liveGoals.get(streamId);
  if (goal) {
    goal.current += paid; // amount comes from the chain, not the client
    await pusherServer.trigger(`live-${streamId}`, 'goal-update', goal);
  }
  return NextResponse.json({ ok: true });
}