import { allPlayers, type Player, type PlayerCount } from "./game.ts";

export type Score = Record<Player, number> & { draw: number };
export type ScoreCategory = "ai" | "local-2" | "local-3" | "local-4" | "legacy";
export type ScoreHistory = { version: 3; tables: Record<ScoreCategory, Score> };
export const scoreCategories: ScoreCategory[] = ["ai", "local-2", "local-3", "local-4", "legacy"];
export const categoryLabels: Record<ScoreCategory, string> = {
  ai: "Ti protiv AI", "local-2": "2 igrača", "local-3": "3 igrača", "local-4": "4 igrača", legacy: "Ranije partije",
};
export function emptyScore(): Score { return { X: 0, O: 0, G: 0, Y: 0, draw: 0 }; }
export function emptyHistory(): ScoreHistory {
  return { version: 3, tables: { ai: emptyScore(), "local-2": emptyScore(), "local-3": emptyScore(), "local-4": emptyScore(), legacy: emptyScore() } };
}
function cleanScore(value: unknown): Score {
  const score = emptyScore();
  if (!value || typeof value !== "object") return score;
  const source = value as Record<string, unknown>;
  for (const key of [...allPlayers, "draw"] as (keyof Score)[]) {
    const count = source[key];
    if (typeof count === "number" && Number.isSafeInteger(count) && count >= 0) score[key] = count;
  }
  return score;
}
export function readScoreHistory(current: string | null, previous: string | null): ScoreHistory {
  const history = emptyHistory();
  try {
    const data = current ? JSON.parse(current) : null;
    if (data?.version === 3 && data.tables && typeof data.tables === "object") {
      for (const category of scoreCategories) history.tables[category] = cleanScore(data.tables[category]);
      return history;
    }
  } catch { /* A damaged save must not prevent the game from starting. */ }
  // Older versions did not record game mode. Keep these results separate rather than guessing.
  try { if (previous) history.tables.legacy = cleanScore(JSON.parse(previous)); } catch {}
  return history;
}
export function matchCategory(mode: "ai" | "local", count: PlayerCount): ScoreCategory {
  return mode === "ai" ? "ai" : ("local-" + count) as ScoreCategory;
}
export function recordResult(history: ScoreHistory, category: ScoreCategory, winner: Player | "draw"): ScoreHistory {
  const current = history.tables[category];
  return { ...history, tables: { ...history.tables, [category]: { ...current, [winner]: Math.min(Number.MAX_SAFE_INTEGER, current[winner] + 1) } } };
}
export function clearResults(history: ScoreHistory, category: ScoreCategory | "all"): ScoreHistory {
  return category === "all" ? emptyHistory() : { ...history, tables: { ...history.tables, [category]: emptyScore() } };
}
export function scoreTotal(score: Score): number {
  return allPlayers.reduce((sum, player) => sum + score[player], score.draw);
}

