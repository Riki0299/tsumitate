"use client";

import { Card, SectionLabel } from "@/components/ui/Card";
import { formatYen } from "@/lib/format";
import { currentYearMonth } from "@/lib/calculations";
import { useAppStore } from "@/lib/store";
import type { Contribution, Fund } from "@/lib/types";

export function CurrentSettingsCard({
  contributions,
  funds,
}: {
  contributions: Contribution[];
  funds: Fund[];
}) {
  const stopContribution = useAppStore((s) => s.stopContribution);
  const active = contributions.filter((c) => c.to === null);
  const total = active.reduce((sum, c) => sum + c.amount, 0);
  const fundOf = (id: string) => funds.find((f) => f.id === id);

  async function handleStop(id: string) {
    if (!confirm("この積立設定を停止しますか？")) return;
    await stopContribution(id, currentYearMonth());
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>現行の積立設定</SectionLabel>
        <span className="text-sm tabular-nums text-stone-300">
          月額合計 {formatYen(total)}
        </span>
      </div>

      {active.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">現在有効な積立設定はありません</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {active.map((c) => {
            const fund = fundOf(c.fundId);
            return (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm text-stone-100">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: fund?.color ?? "#78716c" }}
                    />
                    {fund?.shortName ?? "不明な銘柄"}
                  </div>
                  <div className="mt-0.5 text-xs text-stone-500">
                    {c.method} ・ {formatYen(c.amount)}/月
                  </div>
                </div>
                <button
                  onClick={() => handleStop(c.id)}
                  className="text-xs text-negative"
                >
                  停止
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
