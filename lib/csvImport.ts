import { createFund, findFundByName, upsertSnapshot } from "./db";
import { parseRakutenCsv, toYearMonth, type ParsedSnapshot } from "./parseRakutenCsv";
import type { Fund, Snapshot } from "./types";

const PALETTE = [
  "#3B82F6",
  "#F97316",
  "#A855F7",
  "#22D3EE",
  "#EC4899",
  "#84CC16",
  "#F59E0B",
  "#6366F1",
];

function pickColor(existingCount: number): string {
  return PALETTE[existingCount % PALETTE.length];
}

export type CsvImportResult = {
  parsed: ParsedSnapshot;
  yearMonth: string;
  newFunds: Fund[];
  snapshots: Snapshot[];
};

/**
 * 楽天証券CSVをパースし、未登録の銘柄は funds に自動追加した上で
 * snapshots に upsert する（同月・同銘柄は上書き）。
 */
export async function importRakutenCsv(
  text: string,
  filename: string,
  existingFunds: Fund[],
): Promise<CsvImportResult> {
  const parsed = parseRakutenCsv(text, filename);
  const asOf = parsed.asOf ?? new Date();
  const yearMonth = toYearMonth(asOf);

  const newFunds: Fund[] = [];
  const snapshots: Snapshot[] = [];
  let fundCount = existingFunds.length;

  for (const holding of parsed.holdings) {
    if (holding.marketValue <= 0 && holding.quantity <= 0) continue;

    let fund =
      existingFunds.find((f) => f.name === holding.name) ??
      newFunds.find((f) => f.name === holding.name) ??
      (await findFundByName(holding.name));

    if (!fund) {
      fund = await createFund({
        name: holding.name,
        shortName: holding.name.slice(0, 8),
        color: pickColor(fundCount),
      });
      fundCount += 1;
      newFunds.push(fund);
    }

    const snapshot = await upsertSnapshot({
      yearMonth,
      recordedAt: asOf.toISOString(),
      fundId: fund.id,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      principal: holding.principal,
      marketValue: holding.marketValue,
      source: "csv",
    });
    snapshots.push(snapshot);
  }

  return { parsed, yearMonth, newFunds, snapshots };
}
