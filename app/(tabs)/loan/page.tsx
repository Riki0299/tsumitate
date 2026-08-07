"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { LoanOverviewCard } from "@/components/loan/LoanOverviewCard";
import { LoanStatsCard } from "@/components/loan/LoanStatsCard";
import { LoanBalanceChart } from "@/components/loan/LoanBalanceChart";
import { LoanBreakdownCard } from "@/components/loan/LoanBreakdownCard";
import { LoanForm } from "@/components/loan/LoanForm";
import { Button } from "@/components/ui/Button";

export default function LoanPage() {
  const loan = useAppStore((s) => s.loan);
  const loaded = useAppStore((s) => s.loaded);
  const [editing, setEditing] = useState(false);

  if (!loaded) {
    return <div className="py-20 text-center text-sm text-stone-500">読み込み中...</div>;
  }

  if (!loan || editing) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-stone-100">ローン</h1>
        <LoanForm loan={loan} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-100">ローン</h1>
      <LoanOverviewCard loan={loan} />
      <LoanStatsCard loan={loan} />
      <LoanBalanceChart loan={loan} />
      <LoanBreakdownCard loan={loan} />
      <Button className="w-full" onClick={() => setEditing(true)}>
        設定を変更
      </Button>
    </div>
  );
}
