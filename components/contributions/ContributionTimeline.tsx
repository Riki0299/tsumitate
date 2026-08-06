import { Card, SectionLabel } from "@/components/ui/Card";
import { formatYearMonthLabel, formatYen } from "@/lib/format";
import type { Contribution, Fund } from "@/lib/types";

export function ContributionTimeline({
  contributions,
  funds,
}: {
  contributions: Contribution[];
  funds: Fund[];
}) {
  const fundOf = (id: string) => funds.find((f) => f.id === id);
  const sorted = [...contributions].sort((a, b) => (a.from < b.from ? 1 : -1));

  if (sorted.length === 0) {
    return (
      <Card>
        <SectionLabel>積立履歴</SectionLabel>
        <p className="mt-3 text-sm text-stone-500">履歴はまだありません</p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionLabel>積立履歴</SectionLabel>
      <ol className="mt-3 space-y-3 border-l border-border pl-4">
        {sorted.map((c) => {
          const fund = fundOf(c.fundId);
          const ongoing = c.to === null;
          return (
            <li key={c.id} className="relative">
              <span
                className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ongoing ? "#E8B647" : "#57534e" }}
              />
              <div className="text-xs text-stone-500">
                {formatYearMonthLabel(c.from)} 〜{" "}
                {ongoing ? "継続中" : formatYearMonthLabel(c.to!)}
              </div>
              <div className="text-sm text-stone-200">
                {fund?.shortName ?? "不明な銘柄"} ・ 月{formatYen(c.amount)}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
