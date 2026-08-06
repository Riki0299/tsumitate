export function ProgressBar({
  ratio,
  className = "",
}: {
  /** 0〜100（100%を基準の目盛りとして表示、超過分は満タンで表現） */
  ratio: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, ratio));
  const positive = ratio >= 100;

  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-border ${className}`}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${clamped}%`,
          backgroundColor: positive ? "#34D399" : "#F87171",
        }}
      />
    </div>
  );
}
