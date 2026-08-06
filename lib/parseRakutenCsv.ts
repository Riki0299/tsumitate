/**
 * 楽天証券「保有商品一覧（すべて）」CSV パーサー
 *
 * 想定ファイル: assetbalance(all)_YYYYMMDD_HHmmss.csv
 * 文字コード: UTF-8 (BOMなし)
 * 依存パッケージなし。ブラウザ(File API)でもNode.jsでも動く。
 *
 * CSVの構造は「1枚の表」ではなく、■で始まるセクションが縦に並ぶ形式:
 *   ■資産合計欄        … 資産クラス別のサマリー
 *   ■ 保有商品詳細 (すべて）… 銘柄ごとの明細（本命）
 *   ■参考為替レート     … 為替
 */

export type Holding = {
  /** 種別（投資信託 / 国内株式 など） */
  category: string;
  /** 銘柄コード・ティッカー（投信は空） */
  ticker: string;
  /** 銘柄名 */
  name: string;
  /** 口座区分（NISAつみたて投資枠 など） */
  account: string;
  /** 保有数量 */
  quantity: number;
  /** 数量の単位（口 / 株） */
  quantityUnit: string;
  /** 平均取得価額 */
  avgPrice: number;
  /** 現在値（投信は基準価額） */
  currentPrice: number;
  /** 時価評価額[円] */
  marketValue: number;
  /** 評価損益[円] */
  gainLoss: number;
  /** 評価損益[％] */
  gainLossPct: number;
  /**
   * 取得元本[円]（算出値）
   * 投信は基準価額が1万口あたりなので quantity * avgPrice / 10000。
   * 株式は quantity * avgPrice。
   */
  principal: number;
};

export type ParsedSnapshot = {
  /** ファイル名から取得した基準日時（取れなければ null） */
  asOf: Date | null;
  /** 資産合計[円] */
  totalAssets: number;
  /** 保有商品の評価額合計[円] */
  totalMarketValue: number;
  /** 評価損益[円] */
  totalGainLoss: number;
  /** 保有商品明細 */
  holdings: Holding[];
  /** 参考為替レート（通貨コード -> 円） */
  fxRates: Record<string, number>;
};

/* ------------------------------------------------------------------ */
/* CSV 低レベルパース                                                   */
/* ------------------------------------------------------------------ */

/**
 * RFC4180 準拠の簡易CSVパーサー。
 * フィールド内のカンマ（"222,699"）を正しく扱うため、split(',') は使えない。
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // BOM除去 + 改行コード正規化
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];

    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * "+27,701" "▲1,234" "-" "" → number
 * 空欄・ハイフンは 0 として扱う。
 */
function toNumber(raw: string | undefined): number {
  if (raw == null) return 0;
  const s = raw
    .trim()
    .replace(/,/g, "")
    .replace(/[＋+]/g, "")
    .replace(/[▲△]/g, "-")
    .replace(/[％%円]/g, "");
  if (s === "" || s === "-" || s === "―") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/** 行が空（全セルが空文字）かどうか */
function isBlank(row: string[]): boolean {
  return row.every((c) => c.trim() === "");
}

/** ■で始まるセクション見出し行かどうか（全角スペース等の揺れを吸収） */
function isSectionHeader(row: string[]): boolean {
  return (row[0] ?? "").trim().startsWith("■");
}

function normalize(s: string): string {
  return s.replace(/[\s　]/g, "");
}

/* ------------------------------------------------------------------ */
/* ファイル名 → 基準日時                                                */
/* ------------------------------------------------------------------ */

/**
 * assetbalance(all)_20260806_125046.csv → Date
 * iOSの共有経由で括弧がアンダースコアに置換されることがあるため、
 * 括弧の有無に依存せず数字部分だけを見る。
 */
export function parseAsOfFromFilename(filename: string): Date | null {
  const m = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s),
  );
}

/** Date → "2026-08" （snapshots の year_month 用） */
export function toYearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* メイン                                                              */
/* ------------------------------------------------------------------ */

export function parseRakutenCsv(
  text: string,
  filename = "",
): ParsedSnapshot {
  const rows = parseCsv(text);

  const result: ParsedSnapshot = {
    asOf: parseAsOfFromFilename(filename),
    totalAssets: 0,
    totalMarketValue: 0,
    totalGainLoss: 0,
    holdings: [],
    fxRates: {},
  };

  // セクションごとに行を仕分ける
  let section: "summary" | "holdings" | "fx" | "none" = "none";

  for (const row of rows) {
    if (isSectionHeader(row)) {
      const h = normalize(row[0]);
      if (h.includes("資産合計欄")) section = "summary";
      else if (h.includes("保有商品詳細")) section = "holdings";
      else if (h.includes("参考為替レート")) section = "fx";
      else section = "none";
      continue;
    }

    if (isBlank(row)) continue;

    const label = normalize(row[0] ?? "");

    if (section === "summary") {
      if (label === "資産合計") {
        result.totalAssets = toNumber(row[1]);
        result.totalGainLoss = toNumber(row[6]);
      } else if (label === "保有商品の評価額合計") {
        result.totalMarketValue = toNumber(row[1]);
      }
      continue;
    }

    if (section === "holdings") {
      // ヘッダー行はスキップ
      if (label === "種別") continue;

      const quantityUnit = (row[5] ?? "").trim();
      const quantity = toNumber(row[4]);
      const avgPrice = toNumber(row[6]);

      // 投信の基準価額は1万口あたり。株式は1株あたり。
      const principal =
        quantityUnit === "口"
          ? Math.round((quantity * avgPrice) / 10000)
          : Math.round(quantity * avgPrice);

      result.holdings.push({
        category: (row[0] ?? "").trim(),
        ticker: (row[1] ?? "").trim(),
        name: (row[2] ?? "").trim(),
        account: (row[3] ?? "").trim(),
        quantity,
        quantityUnit,
        avgPrice,
        currentPrice: toNumber(row[8]),
        marketValue: toNumber(row[14]),
        gainLoss: toNumber(row[16]),
        gainLossPct: toNumber(row[17]),
        principal,
      });
      continue;
    }

    if (section === "fx") {
      // "米ドル","157.73","円/USD","(08/06  12:49)"
      const code = (row[2] ?? "").split("/")[1]?.trim();
      if (code) result.fxRates[code] = toNumber(row[1]);
    }
  }

  return result;
}

/* ------------------------------------------------------------------ */
/* Supabase 保存用の行に変換                                           */
/* ------------------------------------------------------------------ */

export type SnapshotRow = {
  year_month: string;
  recorded_at: string;
  fund_name: string;
  account_type: string;
  quantity: number;
  avg_price: number;
  principal: number;
  market_value: number;
  gain_loss: number;
  gain_loss_pct: number;
};

/**
 * パース結果を snapshots テーブルの行に変換する。
 * 同じ year_month + fund_name で upsert する想定（月内に何度取り込んでも上書き）。
 */
export function toSnapshotRows(parsed: ParsedSnapshot): SnapshotRow[] {
  const asOf = parsed.asOf ?? new Date();
  return parsed.holdings
    .filter((h) => h.marketValue > 0)
    .map((h) => ({
      year_month: toYearMonth(asOf),
      recorded_at: asOf.toISOString(),
      fund_name: h.name,
      account_type: h.account,
      quantity: h.quantity,
      avg_price: h.avgPrice,
      principal: h.principal,
      market_value: h.marketValue,
      gain_loss: h.gainLoss,
      gain_loss_pct: h.gainLossPct,
    }));
}
