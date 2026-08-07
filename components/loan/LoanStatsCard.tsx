import { Card, SectionLabel } from "@/components/ui/Card";
import { formatYen } from "@/lib/format";
import { monthlyPayment, totalInterestAmount, totalPaymentAmount } from "@/lib/loan";
import type { Loan } from "@/lib/types";

export function LoanStatsCard({ loan }: { loan: Loan }) {
  const payment = monthlyPayment(loan);
  const total = totalPaymentAmount(loan);
  const interest = totalInterestAmount(loan);

  return (
    <Card>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-stone-400">月返済額</div>
          <div className="mt-1 text-sm font-semibold tabular-nums">{formatYen(payment)}</div>
        </div>
        <div>
          <div className="text-xs text-stone-400">総返済額</div>
          <div className="mt-1 text-sm font-semibold tabular-nums">{formatYen(total)}</div>
        </div>
        <div>
          <div className="text-xs text-stone-400">総利息</div>
          <div className="mt-1 text-sm font-semibold tabular-nums" style={{ color: "#F87171" }}>
            {formatYen(interest)}
          </div>
        </div>
      </div>
    </Card>
  );
}
