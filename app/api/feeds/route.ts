
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const FEEDS_KEY = "live-feeds";

export async function GET() {
  const feeds = (await redis.get(FEEDS_KEY)) ?? [];
  return NextResponse.json(feeds);
}

export async function POST(req: NextRequest) {
  const newFeed = await req.json();
  const feeds: any[] = (await redis.get(FEEDS_KEY)) ?? [];

  const alreadyLive = feeds.some(
    (f) => f.creatorAddress.toLowerCase() === newFeed.creatorAddress.toLowerCase()
  );
  if (alreadyLive) {
    return NextResponse.json({ error: "Wallet already live" }, { status: 409 });
  }

  const updated = [newFeed, ...feeds];
  await redis.set(FEEDS_KEY, updated);
  return NextResponse.json(updated);
}