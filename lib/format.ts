export function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

export function formatSignedYen(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${formatYen(rounded)}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatYearMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  return `${y}年${Number(m)}月`;
}

export function formatYearMonthShort(yearMonth: string): string {
  const [, m] = yearMonth.split("-");
  return `${Number(m)}月`;
}

/**
 * グラフの軸ラベル用。桁に応じて単位を切り替える。
 * 1億以上 → "X.X億" / 1万以上 → "X,XXX万" / それ未満 → "XXXX"
 */
export function formatAxis(v: number): string {
  const n = Math.abs(v);
  if (n === 0) return "0";
  if (n >= 100000000) {
    return `${(v / 100000000).toFixed(1)}億`;
  }
  if (n >= 10000) {
    return `${Math.round(v / 10000).toLocaleString("ja-JP")}万`;
  }
  return Math.round(v).toLocaleString("ja-JP");
}
