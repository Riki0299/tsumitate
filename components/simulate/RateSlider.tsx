"use client";

import { Card, SectionLabel } from "@/components/ui/Card";

export function RateSlider({
  rate,
  onChange,
}: {
  rate: number;
  onChange: (rate: number) => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>年利</SectionLabel>
        <span className="text-lg font-semibold tabular-nums text-gold">
          {rate.toFixed(1)}%
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={0.5}
        value={rate}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 w-full accent-[#E8B647]"
      />
      <div className="mt-1 flex justify-between text-[11px] text-stone-500">
        <span>1%</span>
        <span>10%</span>
      </div>
    </Card>
  );
}
