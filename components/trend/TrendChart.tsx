"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionLabel } from "@/components/ui/Card";
import { formatAxis, formatYearMonthLabel, formatYearMonthShort, formatYen } from "@/lib/format";
import type { TrendPoint } from "@/lib/calculations";

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const principal = payload.find((p) => p.dataKey === "principal")?.value;
  const marketValue = payload.find((p) => p.dataKey === "marketValue")?.value;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-stone-400">{label ? formatYearMonthLabel(label) : ""}</div>
      {marketValue != null && (
        <div className="text-stone-100">評価額 {formatYen(marketValue)}</div>
      )}
      {principal != null && <div className="text-stone-400">元本 {formatYen(principal)}</div>}
    </div>
  );
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <div className="py-10 text-center text-sm text-stone-500">
          データがまだありません
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionLabel>推移</SectionLabel>
      <div className="mt-3 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#292524" vertical={false} />
            <XAxis
              dataKey="yearMonth"
              tickFormatter={formatYearMonthShort}
              tick={{ fill: "#78716c", fontSize: 11 }}
              axisLine={{ stroke: "#292524" }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: "#78716c", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxis}
              width={56}
            />
            <Tooltip content={<TrendTooltip />} />
            <Area
              type="stepAfter"
              dataKey="principal"
              stroke="#57534e"
              strokeWidth={1.5}
              fill="#44403c"
              fillOpacity={0.5}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="marketValue"
              stroke="#E8B647"
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-gold" />
          評価額
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-stone-500" />
          元本
        </span>
      </div>
    </Card>
  );
}
