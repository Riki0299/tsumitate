"use client";

import { useAppStore } from "@/lib/store";
import { buildTrendData } from "@/lib/calculations";
import { TrendChart } from "@/components/trend/TrendChart";
import { ManualEntryForm } from "@/components/trend/ManualEntryForm";

export default function TrendPage() {
  const funds = useAppStore((s) => s.funds);
  const contributions = useAppStore((s) => s.contributions);
  const snapshots = useAppStore((s) => s.snapshots);
  const loaded = useAppStore((s) => s.loaded);

  const data = buildTrendData(contributions, snapshots);

  if (!loaded) {
    return <div className="py-20 text-center text-sm text-stone-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-100">推移</h1>
      <TrendChart data={data} />
      <ManualEntryForm funds={funds} />
    </div>
  );
}
