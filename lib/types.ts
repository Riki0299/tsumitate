export type Fund = {
  id: string;
  name: string;
  shortName: string;
  color: string;
};

export type ContributionMethod = "楽天カード" | "楽天キャッシュ" | "不明" | "その他";

export type Contribution = {
  id: string;
  fundId: string;
  amount: number;
  method: ContributionMethod;
  /** YYYY-MM (適用開始月) */
  from: string;
  /** YYYY-MM (適用終了月, null = 継続中) */
  to: string | null;
};

export type SnapshotSource = "csv" | "manual";

export type Snapshot = {
  id: string;
  /** YYYY-MM */
  yearMonth: string;
  recordedAt: string;
  fundId: string;
  quantity: number;
  avgPrice: number;
  principal: number;
  marketValue: number;
  source: SnapshotSource;
};

export type Settings = {
  annualRate: number;
  currentAge: number | null;
  /** YYYY-MM (投資開始月) */
  investmentStartMonth: string | null;
  /** 投資方針（箇条書き） */
  principles: string[];
  /** 投資の目標 */
  goal: string;
  /** 住宅の初期評価額（円）未設定はnull */
  houseInitialValue: number | null;
  /** 住宅の想定減価率（年%） */
  houseDepreciationRate: number;
  /** 純資産に住宅評価額を含めるか */
  includeHouseValueInNetWorth: boolean;
};

export type RepaymentType = "元利均等";

export type Loan = {
  /** 借入額（円） */
  borrowedAmount: number;
  /** 年利（%） */
  annualRate: number;
  /** 返済期間（年） */
  years: number;
  /** YYYY-MM (返済開始月) */
  startMonth: string;
  repaymentType: RepaymentType;
};
