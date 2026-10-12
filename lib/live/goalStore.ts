import { redis } from './redis';

export type LiveGoal = { title: string; target: number; current: number };
export type LiveFeedEntry = {
  uid: string;
  name: string;
  gift: { id: string; icon: string; label: string; price: number };
  amount: number;
};

const goalKey = (streamId: string) => `live:goal:${streamId}`;
const feedKey = (streamId: string) => `live:feed:${streamId}`;
const seenTxKey = (txHash: string) => `live:seentx:${txHash}`;
const FEED_MAX = 30;
const SEEN_TX_TTL_SECONDS = 60 * 60 * 24; // 1 day — plenty for a demo, keeps the key set from growing forever

export async function getGoal(streamId: string): Promise<LiveGoal | null> {
  return (await redis.get<LiveGoal>(goalKey(streamId))) ?? null;
}

export async function setGoal(streamId: string, goal: LiveGoal): Promise<void> {
  await redis.set(goalKey(streamId), goal);
}

export async function incrementGoal(streamId: string, amount: number): Promise<LiveGoal | null> {
  const goal = await getGoal(streamId);
  if (!goal) return null;
  goal.current += amount;
  await setGoal(streamId, goal);
  return goal;
}

export async function getFeed(streamId: string): Promise<LiveFeedEntry[]> {
  return (await redis.get<LiveFeedEntry[]>(feedKey(streamId))) ?? [];
}

export async function appendFeed(streamId: string, entry: LiveFeedEntry): Promise<void> {
  const list = await getFeed(streamId);
  list.push(entry);
  await redis.set(feedKey(streamId), list.slice(-FEED_MAX));
}

/** Atomic-enough for this use case: returns true if this is the first time we've seen txHash. */
export async function markTxSeen(txHash: string): Promise<boolean> {
  // NX = only set if it doesn't already exist; returns null if it already existed
  const result = await redis.set(seenTxKey(txHash), 1, { nx: true, ex: SEEN_TX_TTL_SECONDS });
  return result === 'OK';
}