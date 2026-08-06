"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { getHoldingSummaries, getPortfolioTotals } from "@/lib/calculations";
import { SummaryCard } from "@/components/home/SummaryCard";
import { HoldingsDonut } from "@/components/home/HoldingsDonut";
import { CsvImportButton } from "@/components/home/CsvImportButton";

export default function HomePage() {
  const funds = useAppStore((s) => s.funds);
  const snapshots = useAppStore((s) => s.snapshots);
  const loaded = useAppStore((s) => s.loaded);

  const holdings = getHoldingSummaries(funds, snapshots);
  const totals = getPortfolioTotals(holdings);

  if (!loaded) {
    return <div className="py-20 text-center text-sm text-stone-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-100">ホーム</h1>
        <Link href="/settings" className="text-xs text-stone-500">
          設定
        </Link>
      </div>

      {holdings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-stone-500">
          まだデータがありません。
          <br />
          CSVを取り込んで開始しましょう。
        </div>
      ) : (
        <>
          <SummaryCard totals={totals} />
          <HoldingsDonut holdings={holdings} />
        </>
      )}

      <CsvImportButton />
    </div>
  );
}
