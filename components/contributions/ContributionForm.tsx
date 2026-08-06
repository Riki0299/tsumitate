"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Card, SectionLabel } from "@/components/ui/Card";
import { currentYearMonth } from "@/lib/calculations";
import type { ContributionMethod, Fund } from "@/lib/types";

const METHODS: ContributionMethod[] = ["楽天カード", "楽天キャッシュ", "その他"];
const NEW_FUND_VALUE = "__new__";
const PALETTE = ["#3B82F6", "#F97316", "#A855F7", "#22D3EE", "#EC4899", "#84CC16"];

export function ContributionForm({ funds }: { funds: Fund[] }) {
  const [open, setOpen] = useState(false);
  const [fundId, setFundId] = useState(funds[0]?.id ?? NEW_FUND_VALUE);
  const [newFundName, setNewFundName] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<ContributionMethod>("楽天カード");
  const [from, setFrom] = useState(currentYearMonth());

  const addFund = useAppStore((s) => s.addFund);
  const addContribution = useAppStore((s) => s.addContribution);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;

    let targetFundId = fundId;
    if (fundId === NEW_FUND_VALUE) {
      if (!newFundName.trim()) return;
      const fund = await addFund({
        name: newFundName.trim(),
        shortName: newFundName.trim().slice(0, 8),
        color: PALETTE[funds.length % PALETTE.length],
      });
      targetFundId = fund.id;
    }

    await addContribution({
      fundId: targetFundId,
      amount: Number(amount),
      method,
      from,
      to: null,
    });

    setAmount("");
    setNewFundName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
        積立設定を追加
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <SectionLabel>積立設定を追加</SectionLabel>
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
              <option value={NEW_FUND_VALUE} className="bg-card">
                + 新しい銘柄
              </option>
            </select>
          </label>

          {fundId === NEW_FUND_VALUE && (
            <label className="block">
              <span className="mb-1 block text-xs text-stone-400">銘柄名</span>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2"
                value={newFundName}
                onChange={(e) => setNewFundName(e.target.value)}
                placeholder="例: eMAXIS Slim 全世界株式"
                required
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-xs text-stone-400">月額（円）</span>
            <input
              type="number"
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-stone-400">決済方法</span>
            <select
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2"
              value={method}
              onChange={(e) => setMethod(e.target.value as ContributionMethod)}
            >
              {METHODS.map((m) => (
                <option key={m} value={m} className="bg-card">
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-stone-400">開始月</span>
            <input
              type="month"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
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
