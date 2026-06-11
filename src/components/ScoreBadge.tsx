import { cn } from "@/lib/utils/cn";
import { classifyScore, type ScoreBand } from "@/lib/scoring";

const bandClasses: Record<ScoreBand, string> = {
  high: "bg-success/10 text-success",
  mid: "bg-warning/10 text-warning",
  low: "bg-error/10 text-error",
};

export function ScoreBadge({ score }: { readonly score: number }) {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-md px-2 text-xs font-semibold",
        bandClasses[classifyScore(clamped)],
      )}
    >
      {clamped.toFixed(0)}
    </span>
  );
}
