import type { Loan, Settings } from "./types";
import { addMonths, currentYearMonth, futureValue } from "./calculations";
import { buildAmortizationSchedule, payoffMonth, type LoanSchedulePoint } from "./loan";

/* ------------------------------------------------------------------ */
/* 月次シリーズ                                                          */
/* ------------------------------------------------------------------ */

export type NetWorthPoint = {
  /** 現在からの経過月数 */
  monthsFromNow: number;
  yearMonth: string;
  savings: number;
  /** 住宅評価額を含めない設定、または未設定の場合はnull */
  houseValue: number | null;
  loanBalance: number;
  netWorth: number;
};

function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

function loanBalanceAt(
  loan: Loan,
  schedule: LoanSchedulePoint[],
  yearMonth: string,
): number {
  const idx = monthsBetween(loan.startMonth, yearMonth) + 1;
  if (idx <= 0) return loan.borrowedAmount;
  if (idx > schedule.length) return 0;
  return schedule[idx - 1].balance;
}

/** 住宅評価額 = 初期評価額 × (1 − 減価率)^経過年数（下限は初期評価額の30%） */
function houseValueAt(loan: Loan, settings: Settings, yearMonth: string): number | null {
  if (!settings.includeHouseValueInNetWorth || settings.houseInitialValue == null) return null;
  const elapsedYears = Math.max(0, monthsBetween(loan.startMonth, yearMonth)) / 12;
  const rate = settings.houseDepreciationRate / 100;
  const factor = Math.max(0.3, Math.pow(1 - rate, elapsedYears));
  return settings.houseInitialValue * factor;
}

export function buildNetWorthSeries(
  loan: Loan,
  settings: Settings,
  currentAssetValue: number,
  monthlyContribution: number,
  now = currentYearMonth(),
): NetWorthPoint[] {
  const schedule = buildAmortizationSchedule(loan);
  const remainingMonths = Math.max(0, monthsBetween(now, payoffMonth(loan)));

  const points: NetWorthPoint[] = [];
  for (let k = 0; k <= remainingMonths; k++) {
    const yearMonth = addMonths(now, k);
    const savings = futureValue(currentAssetValue, monthlyContribution, settings.annualRate, k);
    const loanBalance = loanBalanceAt(loan, schedule, yearMonth);
    const houseValue = houseValueAt(loan, settings, yearMonth);
    const netWorth = savings + (houseValue ?? 0) - loanBalance;
    points.push({ monthsFromNow: k, yearMonth, savings, houseValue, loanBalance, netWorth });
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* グラフ用データ（年単位に間引き）                                          */
/* ------------------------------------------------------------------ */

export type NetWorthChartPoint = {
  /** 現在からの経過年数 */
  year: number;
  yearMonth: string;
  savings: number;
  houseValue: number;
  /** ローン残高（正の値） */
  loanBalance: number;
  netWorth: number;
};

export function buildNetWorthChartData(series: NetWorthPoint[]): NetWorthChartPoint[] {
  const lastMonths = series.at(-1)?.monthsFromNow ?? 0;
  const years = Math.ceil(lastMonths / 12);
  const points: NetWorthChartPoint[] = [];
  for (let year = 0; year <= years; year++) {
    const k = Math.min(year * 12, lastMonths);
    const p = series[k];
    if (!p) continue;
    points.push({
      year,
      yearMonth: p.yearMonth,
      savings: p.savings,
      houseValue: p.houseValue ?? 0,
      loanBalance: p.loanBalance,
      netWorth: p.netWorth,
    });
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* プラス転換時期                                                        */
/* ------------------------------------------------------------------ */

export type NetWorthCrossover =
  | { type: "already" }
  | { type: "future"; yearMonth: string; monthsFromNow: number }
  | { type: "never" };

export function findNetWorthCrossover(series: NetWorthPoint[]): NetWorthCrossover {
  if (series.length === 0) return { type: "never" };
  if (series[0].netWorth >= 0) return { type: "already" };
  for (let i = 1; i < series.length; i++) {
    if (series[i].netWorth >= 0) {
      return {
        type: "future",
        yearMonth: series[i].yearMonth,
        monthsFromNow: series[i].monthsFromNow,
      };
    }
  }
  return { type: "never" };
}

/** 純資産がゼロを跨ぐ瞬間の、グラフ上の座標（経過年数・その時点のローン残高=資産評価額） */
export type NetWorthCrossoverPoint = { year: number; value: number };

export function findNetWorthCrossoverPoint(series: NetWorthPoint[]): NetWorthCrossoverPoint | null {
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1];
    const curr = series[i];
    if (prev.netWorth < 0 && curr.netWorth >= 0) {
      const span = curr.netWorth - prev.netWorth;
      const t = span === 0 ? 0 : -prev.netWorth / span;
      const monthsFromNow = prev.monthsFromNow + t * (curr.monthsFromNow - prev.monthsFromNow);
      const loanBalance = prev.loanBalance + t * (curr.loanBalance - prev.loanBalance);
      return { year: monthsFromNow / 12, value: loanBalance };
    }
  }
  return null;
}
