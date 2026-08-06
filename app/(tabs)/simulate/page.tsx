"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  buildProjection,
  futureValue,
  getHoldingSummaries,
  getPortfolioTotals,
} from "@/lib/calculations";
import { Card, SectionLabel } from "@/components/ui/Card";
import { formatSignedYen, formatYen } from "@/lib/format";
import { RateSlider } from "@/components/simulate/RateSlider";
import { PeriodPresets } from "@/components/simulate/PeriodPresets";
import { ProjectionChart } from "@/components/simulate/ProjectionChart";

export default function SimulatePage() {
  const funds = useAppStore((s) => s.funds);
  const snapshots = useAppStore((s) => s.snapshots);
  const contributions = useAppStore((s) => s.contributions);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const loaded = useAppStore((s) => s.loaded);

  const [months, setMonths] = useState(20 * 12);

  const holdings = getHoldingSummaries(funds, snapshots);
  const totals = getPortfolioTotals(holdings);
  const monthlyContribution = contributions
    .filter((c) => c.to === null)
    .reduce((sum, c) => sum + c.amount, 0);

  const projection = useMemo(
    () => buildProjection(totals.marketValue, monthlyContribution, settings.annualRate, months),
    [totals.marketValue, monthlyContribution, settings.annualRate, months],
  );

  const finalValue = futureValue(
    totals.marketValue,
    monthlyContribution,
    settings.annualRate,
    months,
  );
  const finalPrincipal = totals.marketValue + monthlyContribution * months;
  const finalGain = finalValue - finalPrincipal;

  if (!loaded) {
    return <div className="py-20 text-center text-sm text-stone-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-100">試算</h1>

      <Card>
        <SectionLabel>{(months / 12).toFixed(0)}年後の予想資産額</SectionLabel>
        <div className="mt-1 text-3xl font-semibold tabular-nums">
          {formatYen(finalValue)}
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-stone-400">元本 {formatYen(finalPrincipal)}</span>
          <span style={{ color: finalGain >= 0 ? "#34D399" : "#F87171" }}>
            {formatSignedYen(finalGain)}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-stone-500">
          現在の評価額 {formatYen(totals.marketValue)} ・ 月{formatYen(monthlyContribution)}の積立を継続した場合
        </div>
      </Card>

      <RateSlider
        rate={settings.annualRate}
        onChange={(rate) => updateSettings({ annualRate: rate })}
      />

      <PeriodPresets
        currentAge={settings.currentAge}
        selectedMonths={months}
        onSelect={setMonths}
        onSetAge={(age) => updateSettings({ currentAge: age })}
      />

      <ProjectionChart data={projection} />

      <p className="px-1 text-[11px] leading-relaxed text-stone-500">
        ※
        本シミュレーションは入力条件に基づく複利計算の一例であり、将来の運用成果を保証するものではありません。
      </p>
    </div>
  );
}
