import { Card, SectionLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatYearMonthLabel, formatYen } from "@/lib/format";
import {
  currentBalance,
  elapsedYearsMonths,
  payoffMonth,
  repaidPrincipal,
} from "@/lib/loan";
import type { Loan } from "@/lib/types";

export function LoanOverviewCard({ loan }: { loan: Loan }) {
  const balance = currentBalance(loan);
  const repaid = repaidPrincipal(loan);
  const progressRatio = loan.borrowedAmount > 0 ? (repaid / loan.borrowedAmount) * 100 : 0;
  const { years, months } = elapsedYearsMonths(loan);

  return (
    <Card>
      <SectionLabel>いまの残高</SectionLabel>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{formatYen(balance)}</div>

      <div className="mt-2 text-xs text-stone-400">
        返済済み {years}年{months}ヶ月 / 全{loan.years}年
      </div>
      <div className="mt-0.5 text-xs text-stone-400">
        完済予定 {formatYearMonthLabel(payoffMonth(loan))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
        <span>返済済み元金 {formatYen(repaid)}</span>
        <span>{progressRatio.toFixed(1)}%</span>
      </div>
      <ProgressBar ratio={progressRatio} className="mt-1.5" />
    </Card>
  );
}
