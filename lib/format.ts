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
