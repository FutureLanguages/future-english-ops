export function CompletionRing({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(percent, 100));

  return (
    <div
      className="relative flex h-24 w-24 items-center justify-center rounded-full [--progress:0%] sm:h-28 sm:w-28"
      style={{
        ["--progress" as string]: `${clamped}%`,
        background: "conic-gradient(rgb(var(--color-success-700-rgb)) var(--progress), rgb(var(--color-success-100-rgb)) 0)",
      }}
    >
      <div className="flex h-[78%] w-[78%] flex-col items-center justify-center rounded-full bg-white shadow-inner">
        <span className="text-2xl font-bold text-ink">{clamped}%</span>
        <span className="text-xs font-medium text-ink/55">اكتمال</span>
      </div>
    </div>
  );
}
