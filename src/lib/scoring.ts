export type ScoreBand = "low" | "mid" | "high";

export function classifyScore(score: number): ScoreBand {
  if (score >= 70) return "high";
  if (score >= 50) return "mid";
  return "low";
}
