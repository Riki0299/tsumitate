"use client";

import { useAppStore } from "@/lib/store";
import { CurrentSettingsCard } from "@/components/contributions/CurrentSettingsCard";
import { ContributionTimeline } from "@/components/contributions/ContributionTimeline";
import { ContributionForm } from "@/components/contributions/ContributionForm";

export default function ContributionsPage() {
  const funds = useAppStore((s) => s.funds);
  const contributions = useAppStore((s) => s.contributions);
  const loaded = useAppStore((s) => s.loaded);

  if (!loaded) {
    return <div className="py-20 text-center text-sm text-stone-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-100">積立</h1>
      <CurrentSettingsCard contributions={contributions} funds={funds} />
      <ContributionTimeline contributions={contributions} funds={funds} />
      <ContributionForm funds={funds} />
    </div>
  );
}
