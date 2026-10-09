import { NextResponse } from 'next/server';
import { createPublicClient, http, parseEventLogs, erc20Abi, formatUnits, type Hex } from 'viem';
import { monadTestnet } from 'viem/chains';
import { AUSD_ADDRESS } from '@/lib/monad-tokens';
import { pusherServer } from '@/lib/pusher-server';
import { liveGoals, liveSeenTx ,liveFeed} from '@/lib/live/goalStore';
import { LIVE_CREATOR_ADDRESS } from '@/lib/live/config';

const client = createPublicClient({ chain: monadTestnet, transport: http() });

export async function POST(req: Request) {
  const { streamId, uid, gift, senderId, txHash,name } = await req.json();
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

  const from = match.args.from; 
  const shortAddr = `${from.slice(0, 6)}…${from.slice(-4)}`;
  const cleanName = typeof name === 'string' ? name.trim().slice(0, 24) : '';

  const entry = {
    uid,
    name: cleanName || shortAddr,
     gift: {
      id: String(gift.id).slice(0, 32),
      icon: String(gift.icon).slice(0, 8),
      label: String(gift.label).slice(0, 20),
      price: paid,
    },
    amount: paid,
  };

  const list = liveFeed.get(streamId) ?? [];
  list.push(entry);
  liveFeed.set(streamId, list.slice(-30));

  await pusherServer.trigger(`live-${streamId}`, 'gift', { ...entry, senderId, txHash });

  const goal = liveGoals.get(streamId);
  if (goal) {
    goal.current += paid;
    await pusherServer.trigger(`live-${streamId}`, 'goal-update', goal);
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const streamId = new URL(req.url).searchParams.get('streamId');
  if (!streamId) return NextResponse.json({ error: 'missing streamId' }, { status: 400 });
  return NextResponse.json({ feed: liveFeed.get(streamId) ?? [] });
}