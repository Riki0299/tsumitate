"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionLabel } from "@/components/ui/Card";
import { formatYen } from "@/lib/format";
import type { ProjectionPoint } from "@/lib/calculations";

function ProjectionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload.find((p) => p.dataKey === "value")?.value;
  const principal = payload.find((p) => p.dataKey === "principal")?.value;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-stone-400">{label}年後</div>
      {value != null && <div className="text-stone-100">資産額 {formatYen(value)}</div>}
      {principal != null && <div className="text-stone-400">元本 {formatYen(principal)}</div>}
    </div>
  );
}

export function ProjectionChart({ data }: { data: ProjectionPoint[] }) {
  return (
    <Card>
      <SectionLabel>伸び方</SectionLabel>
      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#292524" vertical={false} />
            <XAxis
              dataKey="years"
              tick={{ fill: "#78716c", fontSize: 11 }}
              axisLine={{ stroke: "#292524" }}
              tickLine={false}
              tickFormatter={(v) => `${v}年`}
            />
            <YAxis
              tick={{ fill: "#78716c", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Math.round(v / 10000)}万`}
              width={44}
            />
            <Tooltip content={<ProjectionTooltip />} />
            <Area
              type="monotone"
              dataKey="principal"
              stroke="#57534e"
              strokeWidth={1.5}
              fill="#44403c"
              fillOpacity={0.5}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#E8B647"
              strokeWidth={2}
              fill="#E8B647"
              fillOpacity={0.15}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
