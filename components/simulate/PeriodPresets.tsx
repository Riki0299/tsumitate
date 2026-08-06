"use client";

import { useState } from "react";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type PeriodPreset = { label: string; months: number };

export function PeriodPresets({
  currentAge,
  selectedMonths,
  onSelect,
  onSetAge,
}: {
  currentAge: number | null;
  selectedMonths: number;
  onSelect: (months: number) => void;
  onSetAge: (age: number) => void;
}) {
  const [ageInput, setAgeInput] = useState(currentAge?.toString() ?? "");

  const presets: PeriodPreset[] = [
    { label: "10年", months: 10 * 12 },
    { label: "20年", months: 20 * 12 },
    { label: "30年", months: 30 * 12 },
  ];
  if (currentAge !== null && currentAge < 65) {
    presets.push({ label: "65歳まで", months: (65 - currentAge) * 12 });
  }

  return (
    <Card>
      <SectionLabel>期間</SectionLabel>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => onSelect(p.months)}
            className="rounded-lg border px-2 py-2 text-xs"
            style={{
              borderColor: selectedMonths === p.months ? "#E8B647" : "#292524",
              color: selectedMonths === p.months ? "#E8B647" : "#a8a29e",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {currentAge === null && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="現在の年齢"
            className="w-24 rounded-lg border border-border bg-transparent px-3 py-2 text-sm tabular-nums"
            value={ageInput}
            onChange={(e) => setAgeInput(e.target.value)}
          />
          <Button
            className="text-xs"
            onClick={() => {
              const age = Number(ageInput);
              if (age > 0 && age < 65) onSetAge(age);
            }}
          >
            年齢を設定して「65歳まで」を追加
          </Button>
        </div>
      )}
    </Card>
  );
}
