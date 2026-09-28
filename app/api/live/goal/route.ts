import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher-server';
import { liveGoals } from '@/lib/live/goalStore';

export async function GET(req: Request) {
  const streamId = new URL(req.url).searchParams.get('streamId');
  if (!streamId) return NextResponse.json({ error: 'missing streamId' }, { status: 400 });
  return NextResponse.json({ goal: liveGoals.get(streamId) ?? null });
}

export async function POST(req: Request) {
  const { streamId, title, target } = await req.json();
  const t = Number(target);
  if (!streamId || !title || !Number.isFinite(t) || t <= 0) {
    return NextResponse.json({ error: 'invalid goal' }, { status: 400 });
  }
  const goal = { title: String(title).slice(0, 60), target: t, current: 0 };
  liveGoals.set(streamId, goal);
  await pusherServer.trigger(`live-${streamId}`, 'goal-update', goal);
  return NextResponse.json({ goal });
}