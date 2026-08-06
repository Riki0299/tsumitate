"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Card, SectionLabel } from "@/components/ui/Card";
import { currentYearMonth } from "@/lib/calculations";
import type { Fund } from "@/lib/types";

export function ManualEntryForm({ funds }: { funds: Fund[] }) {
  const [open, setOpen] = useState(false);
  const [fundId, setFundId] = useState(funds[0]?.id ?? "");
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [principal, setPrincipal] = useState("");
  const [marketValue, setMarketValue] = useState("");
  const addManualSnapshot = useAppStore((s) => s.addManualSnapshot);

  if (funds.length === 0) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fundId || !principal || !marketValue) return;
    await addManualSnapshot({
      fundId,
      yearMonth,
      quantity: 0,
      avgPrice: 0,
      principal: Number(principal),
      marketValue: Number(marketValue),
      recordedAt: new Date().toISOString(),
    });
    setPrincipal("");
    setMarketValue("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button className="w-full" onClick={() => setOpen(true)}>
        記録を手入力で追加
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <SectionLabel>記録を追加</SectionLabel>
        <div className="mt-3 space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block text-xs text-stone-400">銘柄</span>
          <select
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2"
            value={fundId}
            onChange={(e) => setFundId(e.target.value)}
          >
            {funds.map((f) => (
              <option key={f.id} value={f.id} className="bg-card">
                {f.shortName}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-stone-400">対象月</span>
          <input
            type="month"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-stone-400">元本（円）</span>
          <input
            type="number"
            inputMode="numeric"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-stone-400">評価額（円）</span>
          <input
            type="number"
            inputMode="numeric"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
            value={marketValue}
            onChange={(e) => setMarketValue(e.target.value)}
            required
          />
        </label>
        <div className="flex gap-2 pt-1">
          <Button variant="primary" type="submit" className="flex-1">
            追加
          </Button>
          <Button type="button" className="flex-1" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
        </div>
        </div>
      </Card>
    </form>
  );
}
