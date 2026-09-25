import Pusher from 'pusher';
import { NextResponse } from 'next/server';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: Request) {
  const { streamId, uid, gift } = await req.json();
  if (!streamId || !uid || !gift) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }
  await pusher.trigger(`stream-${streamId}`, 'gift', { uid, gift });
  return NextResponse.json({ ok: true });
}