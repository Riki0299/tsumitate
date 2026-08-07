"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, SectionLabel } from "@/components/ui/Card";

export function HouseValueCard() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [initialValue, setInitialValue] = useState(
    settings.houseInitialValue != null ? String(settings.houseInitialValue) : "",
  );
  const [depreciationRate, setDepreciationRate] = useState(String(settings.houseDepreciationRate));

  function handleInitialValueBlur() {
    const n = initialValue.trim() === "" ? null : Number(initialValue);
    updateSettings({ houseInitialValue: n != null && Number.isFinite(n) ? n : null });
  }

  function handleRateBlur() {
    const n = Number(depreciationRate);
    updateSettings({ houseDepreciationRate: Number.isFinite(n) ? n : 1.5 });
  }

  return (
    <Card>
      <SectionLabel>住宅評価額</SectionLabel>
      <p className="mt-2 text-xs leading-relaxed text-stone-500">
        純資産タブで住宅の評価額をどう扱うかを設定します。
      </p>
      <div className="mt-3 space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block text-xs text-stone-400">住宅の初期評価額（円）</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="未設定"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
            value={initialValue}
            onChange={(e) => setInitialValue(e.target.value)}
            onBlur={handleInitialValueBlur}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-stone-400">想定減価率（年%）</span>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
            value={depreciationRate}
            onChange={(e) => setDepreciationRate(e.target.value)}
            onBlur={handleRateBlur}
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-xs text-stone-400">純資産に住宅評価額を含める</span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-[#E8B647]"
            checked={settings.includeHouseValueInNetWorth}
            onChange={(e) => updateSettings({ includeHouseValueInNetWorth: e.target.checked })}
          />
        </label>
      </div>
    </Card>
  );
}
