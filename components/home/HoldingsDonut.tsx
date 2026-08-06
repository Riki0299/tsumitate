"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, SectionLabel } from "@/components/ui/Card";
import { formatPercent, formatYen } from "@/lib/format";
import type { HoldingSummary } from "@/lib/calculations";

export function HoldingsDonut({ holdings }: { holdings: HoldingSummary[] }) {
  if (holdings.length === 0) return null;

  const total = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const data = holdings.map((h) => ({
    name: h.fund.shortName,
    value: h.marketValue,
    color: h.fund.color,
  }));

  return (
    <Card>
      <SectionLabel>保有商品</SectionLabel>
      <div className="mt-2 flex items-center gap-4">
        <div className="h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-2">
          {holdings.map((h) => (
            <li key={h.fund.id} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-stone-300">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: h.fund.color }}
                />
                {h.fund.shortName}
              </span>
              <span className="tabular-nums text-stone-400">
                {formatPercent(total > 0 ? (h.marketValue / total) * 100 : 0, 0)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 space-y-1 border-t border-border pt-3">
        {holdings.map((h) => (
          <div key={h.fund.id} className="flex justify-between text-xs text-stone-400">
            <span>{h.fund.shortName}</span>
            <span className="tabular-nums">{formatYen(h.marketValue)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
