import { createContribution, createFund, getFunds, putSettings } from "./db";
import type { ContributionMethod } from "./types";

const FUND_SEEDS = [
  {
    key: "orcan",
    name: "eMAXIS Slim 全世界株式(オール・カントリー)",
    shortName: "オルカン",
    color: "#E8B647",
  },
  {
    key: "sp500",
    name: "eMAXIS Slim 米国株式(S&P500)",
    shortName: "S&P500",
    color: "#F97316",
  },
] as const;

const CONTRIBUTION_SEEDS: {
  fund: (typeof FUND_SEEDS)[number]["key"];
  amount: number;
  method: ContributionMethod;
  from: string;
  to: string | null;
}[] = [
  { fund: "orcan", amount: 5000, method: "不明", from: "2025-08", to: "2025-10" },
  { fund: "orcan", amount: 10000, method: "不明", from: "2025-11", to: "2026-01" },
  { fund: "orcan", amount: 15000, method: "不明", from: "2026-02", to: "2026-02" },
  { fund: "orcan", amount: 15000, method: "楽天キャッシュ", from: "2026-03", to: null },
  { fund: "orcan", amount: 5000, method: "楽天カード", from: "2026-03", to: null },
  { fund: "sp500", amount: 5000, method: "楽天カード", from: "2026-03", to: null },
];

/**
 * 初回起動時、データが空の場合にダッシュボードの初期データを投入する。
 * 既にデータがある場合は何もしない。
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  const existingFunds = await getFunds();
  if (existingFunds.length > 0) return;

  const fundIdByKey: Record<string, string> = {};
  for (const seed of FUND_SEEDS) {
    const fund = await createFund({
      name: seed.name,
      shortName: seed.shortName,
      color: seed.color,
    });
    fundIdByKey[seed.key] = fund.id;
  }

  for (const c of CONTRIBUTION_SEEDS) {
    await createContribution({
      fundId: fundIdByKey[c.fund],
      amount: c.amount,
      method: c.method,
      from: c.from,
      to: c.to,
    });
  }

  await putSettings({
    annualRate: 5,
    currentAge: 26,
    investmentStartMonth: "2025-08",
    principles: [
      "長期投資で資産を育てる",
      "世界分散でリスクを抑える",
      "積立はコツコツ継続する",
      "相場が下がっても売らない",
      "余剰資金で無理なく投資する",
    ],
    goal: "経済的自由と豊かな人生の実現",
    houseInitialValue: null,
    houseDepreciationRate: 1.5,
    includeHouseValueInNetWorth: true,
  });
}
