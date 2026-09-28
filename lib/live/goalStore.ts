export type LiveGoal = { title: string; target: number; current: number };


const g = globalThis as unknown as {
  __liveGoals?: Map<string, LiveGoal>;
  __liveSeenTx?: Set<string>;
};
export const liveGoals = (g.__liveGoals ??= new Map<string, LiveGoal>());
export const liveSeenTx = (g.__liveSeenTx ??= new Set<string>());