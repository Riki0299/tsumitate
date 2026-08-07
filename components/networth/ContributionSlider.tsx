"use client";

import { Card, SectionLabel } from "@/components/ui/Card";
import { formatYen } from "@/lib/format";

export function ContributionSlider({
  amount,
  onChange,
}: {
  amount: number;
  onChange: (amount: number) => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>試算用の積立額（月）</SectionLabel>
        <span className="text-lg font-semibold tabular-nums text-gold">{formatYen(amount)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100000}
        step={1000}
        value={amount}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 w-full accent-[#E8B647]"
      />
      <div className="mt-1 flex justify-between text-[11px] text-stone-500">
        <span>¥0</span>
        <span>¥100,000</span>
      </div>
      <p className="mt-2 text-[11px] text-stone-500">
        ここで変更しても実際の積立設定には反映されません
      </p>
    </Card>
  );
}
