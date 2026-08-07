"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { getHoldingSummaries, getPortfolioTotals } from "@/lib/calculations";
import {
  buildNetWorthChartData,
  buildNetWorthSeries,
  findNetWorthCrossover,
  findNetWorthCrossoverPoint,
  type NetWorthCrossover,
} from "@/lib/networth";
import { Card, SectionLabel } from "@/components/ui/Card";
import { formatYearMonthLabel, formatYen } from "@/lib/format";
import { NetWorthChart } from "@/components/networth/NetWorthChart";
import { ContributionSlider } from "@/components/networth/ContributionSlider";

function crossoverText(crossover: NetWorthCrossover): string {
  if (crossover.type === "already") return "すでにプラスです";
  if (crossover.type === "never") return "返済期間内には転じません";
  const years = Math.floor(crossover.monthsFromNow / 12);
  const months = crossover.monthsFromNow % 12;
  return `${formatYearMonthLabel(crossover.yearMonth)}（あと${years}年${months}ヶ月）`;
}

export default function NetWorthPage() {
  const loan = useAppStore((s) => s.loan);
  const funds = useAppStore((s) => s.funds);
  const snapshots = useAppStore((s) => s.snapshots);
  const contributions = useAppStore((s) => s.contributions);
  const settings = useAppStore((s) => s.settings);
  const loaded = useAppStore((s) => s.loaded);

  const holdings = getHoldingSummaries(funds, snapshots);
  const totals = getPortfolioTotals(holdings);
  const defaultMonthlyContribution = contributions
    .filter((c) => c.to === null)
    .reduce((sum, c) => sum + c.amount, 0);

  const [monthlyContribution, setMonthlyContribution] = useState(defaultMonthlyContribution);

  const series = useMemo(
    () =>
      loan ? buildNetWorthSeries(loan, settings, totals.marketValue, monthlyContribution) : [],
    [loan, settings, totals.marketValue, monthlyContribution],
  );
  const chartData = useMemo(() => buildNetWorthChartData(series), [series]);
  const crossover = useMemo(() => findNetWorthCrossover(series), [series]);
  const crossoverPoint = useMemo(() => findNetWorthCrossoverPoint(series), [series]);
  const current = series[0];
  const currentNetWorth = current?.netWorth ?? 0;
  const showHouse = settings.includeHouseValueInNetWorth && settings.houseInitialValue != null;

  if (!loaded) {
    return <div className="py-20 text-center text-sm text-stone-500">読み込み中...</div>;
  }

  if (!loan) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-stone-100">純資産</h1>
        <Card>
          <p className="text-sm text-stone-400">
            ローンが未設定のため、純資産を計算できません。
          </p>
          <Link href="/loan" className="mt-3 inline-block text-sm text-gold">
            ローンを設定する →
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-100">純資産</h1>

      <Card>
        <SectionLabel>いまの純資産</SectionLabel>
        <div
          className="mt-1 text-3xl font-semibold tabular-nums"
          style={{ color: currentNetWorth >= 0 ? "#34D399" : "#F87171" }}
        >
          {formatYen(currentNetWorth)}
        </div>
        <div className="mt-2 text-[11px] text-stone-500">
          積立資産 {formatYen(current?.savings ?? 0)}
          {showHouse && current?.houseValue != null
            ? ` ・ 住宅評価額 ${formatYen(current.houseValue)}`
            : ""}
          {" ・ "}ローン残高 {formatYen(current?.loanBalance ?? 0)}
        </div>
      </Card>

      <Card>
        <SectionLabel>プラスに転じる時期</SectionLabel>
        <div className="mt-1 text-sm text-stone-100">{crossoverText(crossover)}</div>
      </Card>

      <NetWorthChart data={chartData} showHouse={showHouse} crossoverPoint={crossoverPoint} />

      <ContributionSlider amount={monthlyContribution} onChange={setMonthlyContribution} />

      <p className="px-1 text-[11px] leading-relaxed text-stone-500">
        ※
        本試算であり、将来の運用成果や不動産価格を保証するものではありません。
      </p>
    </div>
  );
}
