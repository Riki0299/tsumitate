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
export function formatYenAxis(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}億`;
  }
  if (abs >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString("ja-JP")}万`;
  }
  return `${Math.round(amount).toLocaleString("ja-JP")}`;
}
