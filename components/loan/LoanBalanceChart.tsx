"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionLabel } from "@/components/ui/Card";
import { formatAxis, formatYen } from "@/lib/format";
import { buildBalanceChartData, currentChartPosition } from "@/lib/loan";
import type { Loan } from "@/lib/types";

function BalanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const balance = payload.find((p) => p.dataKey === "balance")?.value;
  if (balance == null) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-stone-400">{label}年目</div>
      <div className="text-stone-100">残高 {formatYen(balance)}</div>
    </div>
  );
}

export function LoanBalanceChart({ loan }: { loan: Loan }) {
  const data = buildBalanceChartData(loan);
  const now = currentChartPosition(loan);

  return (
    <Card>
      <SectionLabel>残高推移</SectionLabel>
      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#292524" vertical={false} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, loan.years]}
              tick={{ fill: "#78716c", fontSize: 11 }}
              axisLine={{ stroke: "#292524" }}
              tickLine={false}
              tickFormatter={(v) => `${v}年`}
            />
            <YAxis
              tick={{ fill: "#78716c", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxis}
              width={56}
            />
            <Tooltip content={<BalanceTooltip />} />
            <ReferenceLine
              x={now.year}
              stroke="#E8B647"
              strokeDasharray="4 4"
              label={{
                value: "いまここ",
                position: "insideTopLeft",
                fill: "#E8B647",
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#E8B647"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceDot
              x={now.year}
              y={now.balance}
              r={4}
              fill="#E8B647"
              stroke="#0C0A09"
              strokeWidth={2}
              isFront
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
