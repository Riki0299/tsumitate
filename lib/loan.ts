import type { Loan } from "./types";
import { addMonths, currentYearMonth } from "./calculations";

/* ------------------------------------------------------------------ */
/* 基本計算（元利均等返済）                                               */
/* ------------------------------------------------------------------ */

export function monthlyRate(loan: Loan): number {
  return loan.annualRate / 100 / 12;
}

export function totalPayments(loan: Loan): number {
  return loan.years * 12;
}

/** 月返済額 = P × r(1+r)^n / ((1+r)^n − 1)（年利0%なら P / n） */
export function monthlyPayment(loan: Loan): number {
  const P = loan.borrowedAmount;
  const r = monthlyRate(loan);
  const n = totalPayments(loan);
  if (n <= 0) return 0;
  if (r === 0) return P / n;
  const factor = Math.pow(1 + r, n);
  return (P * r * factor) / (factor - 1);
}

export function totalPaymentAmount(loan: Loan): number {
  return monthlyPayment(loan) * totalPayments(loan);
}

export function totalInterestAmount(loan: Loan): number {
  return totalPaymentAmount(loan) - loan.borrowedAmount;
}

/** 完済月（YYYY-MM） */
export function payoffMonth(loan: Loan): string {
  return addMonths(loan.startMonth, totalPayments(loan) - 1);
}

/* ------------------------------------------------------------------ */
/* 返済スケジュール                                                      */
/* ------------------------------------------------------------------ */

export type LoanSchedulePoint = {
  /** 1始まりの返済回数 */
  monthIndex: number;
  yearMonth: string;
  balance: number;
  principalPaid: number;
  interestPaid: number;
};

export function buildAmortizationSchedule(loan: Loan): LoanSchedulePoint[] {
  const n = totalPayments(loan);
  const r = monthlyRate(loan);
  const payment = monthlyPayment(loan);
  const points: LoanSchedulePoint[] = [];
  let balance = loan.borrowedAmount;

  for (let i = 1; i <= n; i++) {
    const interestPaid = balance * r;
    let principalPaid = payment - interestPaid;
    if (i === n) principalPaid = balance; // 最終回で端数を吸収
    balance = Math.max(0, balance - principalPaid);
    points.push({
      monthIndex: i,
      yearMonth: addMonths(loan.startMonth, i - 1),
      balance,
      principalPaid,
      interestPaid,
    });
  }
  return points;
}

/** 開始月から now までの経過返済回数（開始前は0、完済後は総回数でクランプ） */
export function elapsedMonths(loan: Loan, now = currentYearMonth()): number {
  const [sy, sm] = loan.startMonth.split("-").map(Number);
  const [ny, nm] = now.split("-").map(Number);
  const diff = (ny - sy) * 12 + (nm - sm) + 1;
  return Math.max(0, Math.min(totalPayments(loan), diff));
}

export function elapsedYearsMonths(
  loan: Loan,
  now = currentYearMonth(),
): { years: number; months: number } {
  const elapsed = elapsedMonths(loan, now);
  return { years: Math.floor(elapsed / 12), months: elapsed % 12 };
}

/** 現時点の残高 */
export function currentBalance(loan: Loan, now = currentYearMonth()): number {
  const elapsed = elapsedMonths(loan, now);
  if (elapsed <= 0) return loan.borrowedAmount;
  const schedule = buildAmortizationSchedule(loan);
  return schedule[elapsed - 1]?.balance ?? 0;
}

/** 返済済み元金合計（進捗バー用） */
export function repaidPrincipal(loan: Loan, now = currentYearMonth()): number {
  return loan.borrowedAmount - currentBalance(loan, now);
}

/* ------------------------------------------------------------------ */
/* 残高推移グラフ用データ（年単位に間引き）                                  */
/* ------------------------------------------------------------------ */

export type LoanChartPoint = {
  /** 経過年数 */
  year: number;
  yearMonth: string;
  balance: number;
};

export function buildBalanceChartData(loan: Loan): LoanChartPoint[] {
  const schedule = buildAmortizationSchedule(loan);
  const points: LoanChartPoint[] = [
    { year: 0, yearMonth: loan.startMonth, balance: loan.borrowedAmount },
  ];
  for (let year = 1; year <= loan.years; year++) {
    const index = Math.min(year * 12, schedule.length) - 1;
    const point = schedule[index];
    if (point) {
      points.push({ year, yearMonth: point.yearMonth, balance: point.balance });
    }
  }
  return points;
}

/** グラフ上の「いまここ」位置（経過年数、小数可） */
export function currentChartPosition(
  loan: Loan,
  now = currentYearMonth(),
): { year: number; balance: number } {
  const elapsed = elapsedMonths(loan, now);
  return { year: elapsed / 12, balance: currentBalance(loan, now) };
}
