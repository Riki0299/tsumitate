import { Card, SectionLabel } from "@/components/ui/Card";
import { formatYen } from "@/lib/format";
import { totalInterestAmount, totalPaymentAmount } from "@/lib/loan";
import type { Loan } from "@/lib/types";

export function LoanBreakdownCard({ loan }: { loan: Loan }) {
  const total = totalPaymentAmount(loan);
  const interest = totalInterestAmount(loan);
  const principal = loan.borrowedAmount;
  const principalRatio = total > 0 ? (principal / total) * 100 : 0;
  const interestRatio = 100 - principalRatio;

  return (
    <Card>
      <SectionLabel>元金と利息の内訳</SectionLabel>

      <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-border">
        <div style={{ width: `${principalRatio}%`, backgroundColor: "#E8B647" }} />
        <div style={{ width: `${interestRatio}%`, backgroundColor: "#F87171" }} />
      </div>

      <div className="mt-3 flex justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#E8B647" }} />
          <span className="text-stone-400">借りた分</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-stone-400">利息として払う分</span>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#F87171" }} />
        </div>
      </div>
      <div className="mt-1 flex justify-between text-xs tabular-nums text-stone-200">
        <span>{formatYen(principal)}</span>
        <span>{formatYen(interest)}</span>
      </div>
    </Card>
  );
}
