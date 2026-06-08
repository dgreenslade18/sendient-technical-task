import { cn } from "@/lib/utils/cn";

export function ScoreBadge({ score }: { readonly score: number }) {
  // Score-to-colour mapping. Note: hardcoded Tailwind colours rather than
  // semantic tokens, and the upper bound is not defended against here either.
  let cls = "bg-red-100 text-red-700";
  if (score >= 70) cls = "bg-green-100 text-green-700";
  else if (score >= 50) cls = "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-md px-2 text-xs font-semibold",
        cls,
      )}
    >
      {score.toFixed(0)}
    </span>
  );
}
