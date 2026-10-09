export type LiveGoal = { title: string; target: number; current: number };
export type LiveFeedEntry = {
  uid: string;
  name: string;
  gift: { id: string; icon: string; label: string; price: number };
  amount: number;
};


const g = globalThis as unknown as {
  __liveGoals?: Map<string, LiveGoal>;
  __liveSeenTx?: Set<string>;
  __liveFeed?: Map<string, LiveFeedEntry[]>;
};
export const liveGoals = (g.__liveGoals ??= new Map<string, LiveGoal>());
export const liveSeenTx = (g.__liveSeenTx ??= new Set<string>());
export const liveFeed = (g.__liveFeed ??= new Map<string, LiveFeedEntry[]>());