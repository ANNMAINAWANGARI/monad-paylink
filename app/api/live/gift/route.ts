import { NextResponse } from 'next/server';
import { createPublicClient, http, parseEventLogs, erc20Abi, formatUnits, type Hex } from 'viem';
import { monadTestnet } from 'viem/chains';
import { AUSD_ADDRESS } from '@/lib/monad-tokens';
import { pusherServer } from '@/lib/pusher-server';
import { LIVE_CREATOR_ADDRESS } from '@/lib/live/config';
import { getGoal, incrementGoal, appendFeed, markTxSeen } from '@/lib/live/goalStore';

const client = createPublicClient({ chain: monadTestnet, transport: http() });

export async function POST(req: Request) {
  const { streamId, uid, gift, senderId, txHash, name } = await req.json();
  if (!streamId || !uid || !gift || !txHash) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const firstTime = await markTxSeen(txHash);
  if (!firstTime) {
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

  await appendFeed(streamId, entry);
  await pusherServer.trigger(`live-${streamId}`, 'gift', { ...entry, senderId, txHash });

  const goal = await incrementGoal(streamId, paid);
  if (goal) {
    await pusherServer.trigger(`live-${streamId}`, 'goal-update', goal);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const streamId = new URL(req.url).searchParams.get('streamId');
  if (!streamId) return NextResponse.json({ error: 'missing streamId' }, { status: 400 });
  const { getFeed } = await import('@/lib/live/goalStore');
  return NextResponse.json({ feed: await getFeed(streamId) });
}