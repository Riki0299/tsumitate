"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { currentYearMonth } from "@/lib/calculations";
import type { Loan } from "@/lib/types";

export function LoanForm({ loan, onDone }: { loan: Loan | null; onDone: () => void }) {
  const updateLoan = useAppStore((s) => s.updateLoan);

  const [borrowedAmount, setBorrowedAmount] = useState(
    loan ? String(loan.borrowedAmount) : "",
  );
  const [annualRate, setAnnualRate] = useState(loan ? String(loan.annualRate) : "");
  const [years, setYears] = useState(loan ? String(loan.years) : "");
  const [startMonth, setStartMonth] = useState(loan?.startMonth ?? currentYearMonth());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!borrowedAmount || !annualRate || !years || !startMonth) return;

    await updateLoan({
      borrowedAmount: Number(borrowedAmount),
      annualRate: Number(annualRate),
      years: Number(years),
      startMonth,
      repaymentType: "元利均等",
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <SectionLabel>ローン設定</SectionLabel>
        <div className="mt-3 space-y-3 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs text-stone-400">借入額（円）</span>
            <input
              type="number"
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
              value={borrowedAmount}
              onChange={(e) => setBorrowedAmount(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-stone-400">年利（%）</span>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-stone-400">返済期間（年）</span>
            <input
              type="number"
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-stone-400">返済開始月</span>
            <input
              type="month"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 tabular-nums"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-stone-400">返済方式</span>
            <select
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-stone-400"
              value="元利均等"
              disabled
            >
              <option value="元利均等" className="bg-card">
                元利均等
              </option>
            </select>
          </label>

          <div className="flex gap-2 pt-1">
            <Button variant="primary" type="submit" className="flex-1">
              保存
            </Button>
            {loan && (
              <Button type="button" className="flex-1" onClick={onDone}>
                キャンセル
              </Button>
            )}
          </div>
        </div>
      </Card>
    </form>
  );
}
