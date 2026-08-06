import type { Contribution, Fund, Snapshot } from "./types";

/* ------------------------------------------------------------------ */
/* 基本計算                                                             */
/* ------------------------------------------------------------------ */

/** 取得元本（投信）= 保有数量 × 平均取得価額 ÷ 10000 */
export function calcPrincipal(quantity: number, avgPrice: number): number {
  return Math.round((quantity * avgPrice) / 10000);
}

/** 評価損益 = 時価評価額 − 取得元本 */
export function calcGainLoss(marketValue: number, principal: number): number {
  return marketValue - principal;
}

/** 元本に対する評価額の割合[%]（元本0なら0） */
export function calcProgressRatio(marketValue: number, principal: number): number {
  if (principal <= 0) return 0;
  return (marketValue / principal) * 100;
}

/* ------------------------------------------------------------------ */
/* 保有商品サマリー（ホーム画面）                                          */
/* ------------------------------------------------------------------ */

export type HoldingSummary = {
  fund: Fund;
  quantity: number;
  avgPrice: number;
  principal: number;
  marketValue: number;
  gainLoss: number;
  yearMonth: string;
};

/** ファンドごとの最新スナップショットを返す */
export function getLatestSnapshotByFund(
  snapshots: Snapshot[],
): Map<string, Snapshot> {
  const latest = new Map<string, Snapshot>();
  for (const s of snapshots) {
    const cur = latest.get(s.fundId);
    if (!cur || s.yearMonth > cur.yearMonth) {
      latest.set(s.fundId, s);
    }
  }
  return latest;
}

export function getHoldingSummaries(
  funds: Fund[],
  snapshots: Snapshot[],
): HoldingSummary[] {
  const latest = getLatestSnapshotByFund(snapshots);
  const summaries: HoldingSummary[] = [];
  for (const fund of funds) {
    const s = latest.get(fund.id);
    if (!s) continue;
    summaries.push({
      fund,
      quantity: s.quantity,
      avgPrice: s.avgPrice,
      principal: s.principal,
      marketValue: s.marketValue,
      gainLoss: calcGainLoss(s.marketValue, s.principal),
      yearMonth: s.yearMonth,
    });
  }
  return summaries.sort((a, b) => b.marketValue - a.marketValue);
}

export type PortfolioTotals = {
  principal: number;
  marketValue: number;
  gainLoss: number;
  progressRatio: number;
  lastUpdated: string | null;
};

export function getPortfolioTotals(holdings: HoldingSummary[]): PortfolioTotals {
  const principal = holdings.reduce((sum, h) => sum + h.principal, 0);
  const marketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const lastUpdated = holdings.reduce<string | null>(
    (max, h) => (!max || h.yearMonth > max ? h.yearMonth : max),
    null,
  );
  return {
    principal,
    marketValue,
    gainLoss: calcGainLoss(marketValue, principal),
    progressRatio: calcProgressRatio(marketValue, principal),
    lastUpdated,
  };
}

/* ------------------------------------------------------------------ */
/* 月ユーティリティ                                                      */
/* ------------------------------------------------------------------ */

/** "2026-08" 形式の現在月 */
export function currentYearMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** from〜to（両端含む）の月リスト */
export function monthRange(from: string, to: string): string[] {
  const months: string[] = [];
  let cur = from;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    months.push(cur);
    if (cur >= to) break;
    cur = addMonths(cur, 1);
  }
  return months;
}

/* ------------------------------------------------------------------ */
/* 推移グラフ（元本は実測優先、無い月はcontributionsから累積推計）             */
/* ------------------------------------------------------------------ */

export type TrendPoint = {
  yearMonth: string;
  principal: number;
  marketValue: number | null;
  source: "measured" | "estimated";
};

/** 指定月に有効な積立設定の月額合計 */
function activeContributionAmount(
  contributions: Contribution[],
  yearMonth: string,
): number {
  return contributions
    .filter((c) => c.from <= yearMonth && (c.to === null || c.to >= yearMonth))
    .reduce((sum, c) => sum + c.amount, 0);
}

export function buildTrendData(
  contributions: Contribution[],
  snapshots: Snapshot[],
): TrendPoint[] {
  if (contributions.length === 0 && snapshots.length === 0) return [];

  const snapshotMonths = new Map<string, Snapshot[]>();
  for (const s of snapshots) {
    const arr = snapshotMonths.get(s.yearMonth) ?? [];
    arr.push(s);
    snapshotMonths.set(s.yearMonth, arr);
  }

  const earliestContribution = contributions.reduce<string | null>(
    (min, c) => (!min || c.from < min ? c.from : min),
    null,
  );
  const earliestSnapshot = snapshots.reduce<string | null>(
    (min, s) => (!min || s.yearMonth < min ? s.yearMonth : min),
    null,
  );
  const latestSnapshot = snapshots.reduce<string | null>(
    (max, s) => (!max || s.yearMonth > max ? s.yearMonth : max),
    null,
  );

  const start = [earliestContribution, earliestSnapshot]
    .filter((v): v is string => v !== null)
    .sort()[0];
  if (!start) return [];

  const end = [latestSnapshot, currentYearMonth()]
    .filter((v): v is string => v !== null)
    .sort()
    .at(-1)!;

  const months = monthRange(start, end);

  let cumulativeEstimate = 0;
  const points: TrendPoint[] = [];
  for (const month of months) {
    cumulativeEstimate += activeContributionAmount(contributions, month);

    const measured = snapshotMonths.get(month);
    if (measured && measured.length > 0) {
      const principal = measured.reduce((sum, s) => sum + s.principal, 0);
      const marketValue = measured.reduce((sum, s) => sum + s.marketValue, 0);
      points.push({ yearMonth: month, principal, marketValue, source: "measured" });
    } else {
      points.push({
        yearMonth: month,
        principal: cumulativeEstimate,
        marketValue: null,
        source: "estimated",
      });
    }
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* 試算（将来価値）                                                      */
/* ------------------------------------------------------------------ */

/**
 * 複利計算による将来価値。
 * FV = P(1+r)^n + M((1+r)^n − 1)/r   （r = 年利/12、n = 月数）
 */
export function futureValue(
  presentValue: number,
  monthlyContribution: number,
  annualRatePct: number,
  months: number,
): number {
  const r = annualRatePct / 100 / 12;
  if (months <= 0) return presentValue;
  if (r === 0) return presentValue + monthlyContribution * months;
  const factor = Math.pow(1 + r, months);
  return presentValue * factor + (monthlyContribution * (factor - 1)) / r;
}

export type ProjectionPoint = {
  months: number;
  years: number;
  principal: number;
  value: number;
};

export function buildProjection(
  presentValue: number,
  monthlyContribution: number,
  annualRatePct: number,
  totalMonths: number,
  stepMonths = 12,
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  for (let m = 0; m <= totalMonths; m += stepMonths) {
    points.push({
      months: m,
      years: m / 12,
      principal: presentValue + monthlyContribution * m,
      value: futureValue(presentValue, monthlyContribution, annualRatePct, m),
    });
  }
  if (points.at(-1)?.months !== totalMonths) {
    points.push({
      months: totalMonths,
      years: totalMonths / 12,
      principal: presentValue + monthlyContribution * totalMonths,
      value: futureValue(presentValue, monthlyContribution, annualRatePct, totalMonths),
    });
  }
  return points;
}
