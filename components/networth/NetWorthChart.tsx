"use client";

import Link from "next/link";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionLabel } from "@/components/ui/Card";
import { formatAxis, formatYen } from "@/lib/format";
import type { NetWorthChartPoint, NetWorthCrossoverPoint } from "@/lib/networth";

function NetWorthTooltip({
  active,
  payload,
  label,
  showHouse,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: number;
  showHouse: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const savings = payload.find((p) => p.dataKey === "savings")?.value;
  const houseValue = payload.find((p) => p.dataKey === "houseValue")?.value;
  const loanBalance = payload.find((p) => p.dataKey === "loanBalance")?.value;
  const netWorth = payload.find((p) => p.dataKey === "netWorth")?.value;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-stone-400">{label}年後</div>
      {netWorth != null && <div className="text-stone-100">純資産 {formatYen(netWorth)}</div>}
      {savings != null && <div className="text-stone-400">積立資産 {formatYen(savings)}</div>}
      {showHouse && houseValue != null && (
        <div className="text-stone-400">住宅評価額 {formatYen(houseValue)}</div>
      )}
      {loanBalance != null && (
        <div className="text-stone-400">ローン残高 {formatYen(loanBalance)}</div>
      )}
    </div>
  );
}

function computeYDomain(data: NetWorthChartPoint[]): [number, number] {
  let min = 0;
  let max = 0;
  for (const p of data) {
    const assetTop = p.savings + p.houseValue;
    min = Math.min(min, p.netWorth);
    max = Math.max(max, p.loanBalance, assetTop);
  }
  const padding = Math.max((max - min) * 0.08, 1);
  return [Math.floor(min - padding), Math.ceil(max + padding)];
}

export function NetWorthChart({
  data,
  showHouse,
  crossoverPoint,
}: {
  data: NetWorthChartPoint[];
  showHouse: boolean;
  crossoverPoint: NetWorthCrossoverPoint | null;
}) {
  const domain = computeYDomain(data);

  return (
    <Card>
      <SectionLabel>純資産の推移</SectionLabel>
      <div className="mt-3 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#292524" vertical={false} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, "dataMax"]}
              tick={{ fill: "#78716c", fontSize: 11 }}
              axisLine={{ stroke: "#292524" }}
              tickLine={false}
              tickFormatter={(v) => `${v}年`}
            />
            <YAxis
              domain={domain}
              tick={{ fill: "#78716c", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxis}
              width={56}
            />
            <Tooltip content={<NetWorthTooltip showHouse={showHouse} />} />
            <ReferenceLine y={0} stroke="#57534e" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="savings"
              stackId="asset"
              stroke="#34D399"
              strokeWidth={1.5}
              fill="#34D399"
              fillOpacity={0.25}
              isAnimationActive={false}
            />
            {showHouse && (
              <Area
                type="monotone"
                dataKey="houseValue"
                stackId="asset"
                stroke="#E8B647"
                strokeWidth={1.5}
                fill="#E8B647"
                fillOpacity={0.15}
                isAnimationActive={false}
              />
            )}
            <Area
              type="monotone"
              dataKey="loanBalance"
              baseValue={0}
              stroke="#F87171"
              strokeWidth={1.5}
              fill="#F87171"
              fillOpacity={0.12}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="#F5F5F4"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            {crossoverPoint && (
              <ReferenceDot
                x={crossoverPoint.year}
                y={crossoverPoint.value}
                r={4}
                fill="#E8B647"
                stroke="#0C0A09"
                strokeWidth={2}
                isFront
                label={(props: { viewBox?: { x?: number; y?: number } }) => {
                  const cx = props.viewBox?.x ?? 0;
                  const cy = props.viewBox?.y ?? 0;
                  const nearRightEdge = crossoverPoint.year > (data.at(-1)?.year ?? 0) * 0.7;
                  return (
                    <text
                      x={cx}
                      y={cy - 10}
                      textAnchor={nearRightEdge ? "end" : "middle"}
                      fill="#E8B647"
                      fontSize={11}
                    >
                      ここで逆転
                    </text>
                  );
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-positive" />
          積立資産
        </span>
        {showHouse && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-gold" />
            住宅評価額
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-negative" />
          ローン残高
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-stone-100" />
          純資産
        </span>
      </div>
      {!showHouse && (
        <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
          住宅評価額は未設定です。
          <Link href="/settings" className="text-gold">
            設定タブ
          </Link>
          で初期評価額を入力すると純資産に反映されます。
        </p>
      )}
    </Card>
  );
}
