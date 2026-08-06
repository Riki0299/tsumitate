export type Fund = {
  id: string;
  name: string;
  shortName: string;
  color: string;
};

export type ContributionMethod = "楽天カード" | "楽天キャッシュ" | "その他";

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
};
