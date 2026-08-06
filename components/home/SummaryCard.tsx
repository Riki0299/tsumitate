import { Card, SectionLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatPercent, formatSignedYen, formatYen, formatYearMonthLabel } from "@/lib/format";
import type { PortfolioTotals } from "@/lib/calculations";

export function SummaryCard({ totals }: { totals: PortfolioTotals }) {
  const isPositive = totals.gainLoss >= 0;

  return (
    <Card>
      <SectionLabel>評価額</SectionLabel>
      <div className="mt-1 text-3xl font-semibold tabular-nums">
        {formatYen(totals.marketValue)}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="text-lg font-medium tabular-nums"
          style={{ color: isPositive ? "#34D399" : "#F87171" }}
        >
          {formatSignedYen(totals.gainLoss)}
        </span>
        <span
          className="text-sm tabular-nums"
          style={{ color: isPositive ? "#34D399" : "#F87171" }}
        >
          ({formatPercent(totals.principal > 0 ? (totals.gainLoss / totals.principal) * 100 : 0)})
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
        <span>元本 {formatYen(totals.principal)}</span>
        <span>{formatPercent(totals.progressRatio)}</span>
      </div>
      <ProgressBar ratio={totals.progressRatio} className="mt-1.5" />

      {totals.lastUpdated && (
        <div className="mt-3 text-right text-[11px] text-stone-500">
          最終更新: {formatYearMonthLabel(totals.lastUpdated)}
        </div>
      )}
    </Card>
  );
}
