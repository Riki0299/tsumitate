# 積立管理アプリ 仕様書

楽天証券のNISAつみたて状況を可視化する個人用PWA。

## 技術構成

- Next.js 14 (App Router) / TypeScript
- Supabase (Postgres) — `isSupabaseConfigured()` でモックデータにフォールバック
- Vercel
- グラフ: Recharts
- PWA: 自前のservice worker（next-pwaは使わない）
- フォント: システムフォント

## データモデル

```sql
-- 商品マスタ
create table funds (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,         -- CSVの「銘柄」と完全一致させる
  short_name  text not null,                -- 表示用（例: オルカン）
  color       text not null,                -- グラフ用 (#3B82F6 等)
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- 積立設定（履歴として持つ。終了日nullが現行設定）
create table contributions (
  id            uuid primary key default gen_random_uuid(),
  fund_id       uuid not null references funds(id) on delete cascade,
  monthly_amount int  not null,             -- 月額（円）
  payment_method text,                      -- 楽天カード / 楽天キャッシュ（過去分は不明のためnull可）
  started_on    date not null,              -- 適用開始月の1日
  ended_on      date,                       -- null = 現在も継続中
  created_at    timestamptz not null default now()
);

-- 月次スナップショット（CSV取込 or 手入力）
create table snapshots (
  id            uuid primary key default gen_random_uuid(),
  year_month    text not null,              -- 'YYYY-MM'
  recorded_at   timestamptz not null,
  fund_id       uuid not null references funds(id) on delete cascade,
  account_type  text,                       -- NISAつみたて投資枠 等
  quantity      numeric,                    -- 保有数量（口）
  avg_price     numeric,                    -- 平均取得価額
  principal     int not null,               -- 取得元本（円）
  market_value  int not null,               -- 時価評価額（円）
  gain_loss     int not null,               -- 評価損益（円）
  gain_loss_pct numeric,                    -- 評価損益（％）
  source        text not null default 'csv',-- 'csv' | 'manual'
  created_at    timestamptz not null default now(),
  unique (year_month, fund_id)              -- 同月の再取込はupsertで上書き
);

create index on snapshots (year_month);
```

`unique (year_month, fund_id)` が重要。月に何度CSVを取り込んでも行が増えず、最新の値で上書きされる。

## 計算ルール

すべて `snapshots` と `contributions` から導出する。DBに冗長な合計値は持たない。

| 項目 | 式 |
|---|---|
| 取得元本（投信） | `保有数量 × 平均取得価額 ÷ 10000` ※基準価額は1万口あたり |
| 取得元本（株式） | `保有数量 × 平均取得価額` |
| 評価損益 | `時価評価額 − 取得元本` |
| 元本に対する評価額の割合 | `時価評価額 ÷ 取得元本 × 100` |
| 資産構成比 | `各銘柄の時価評価額 ÷ 合計時価評価額` |

検算済み（2026-08-06 時点のCSV）:
- オルカン: 57,147口 × 33,247.59 ÷ 10000 = 190,000円 → 評価額217,701 − 損益27,701 = 190,000 ✓
- S&P500: 1,115口 × 44,843.05 ÷ 10000 = 5,000円 → 評価額4,998 − 損益(−2) = 5,000 ✓
- 元本合計 195,000円

## 認証・公開範囲

認証なし。個人利用で、URLを知っている人だけがアクセスする前提。

そのぶん最低限これはやる:
- `robots.txt` と `<meta name="robots" content="noindex,nofollow">` で検索避け
- Supabase の RLS を有効化し、anon キーで触れる範囲を必要最小限に絞る
  （anon キーはクライアントに露出するため、RLSを切ったままだとURLを知らなくてもDBを直接読める）

## 元本ラインの描き方（実測優先）

積立設定から計算した累計元本と、CSVの実測値は一致しないことがある
（設定変更の反映月と約定月のズレなど）。そのため:

- スナップショットがある月 → `snapshots.principal` の合計をそのまま使う
- 無い月 → `contributions` からの推計値を使う

こうすれば設定履歴が多少ズレていてもグラフは実態と合う。

## 将来シミュレーション

複利計算。毎月末に積み立てる前提の期末価値。

```
FV = P × (1+r)^n + M × ((1+r)^n − 1) / r
  P = 現在の評価額
  M = 毎月の積立額（contributions の現行設定の合計）
  r = 年利 ÷ 12
  n = 月数
```

UI: 年利スライダー（1〜10%、初期値5%）＋期間プリセット（10年 / 20年 / 30年 / 65歳まで）。
「シミュレーションであり将来の運用成果を保証するものではない」旨の注記を必ず表示する。

## CSVインポート

`parseRakutenCsv.ts` を使う（実装済み・実ファイルで動作確認済み）。

### 取得方法
楽天証券にログイン → マイメニュー → 保有商品一覧（すべて）→「CSVで保存」
※PC版サイト表示が必要。iPhoneはSafariの「デスクトップ用Webサイトを表示」に切り替える。

### 注意点
- 文字コードは **UTF-8（BOMなし）**。Shift_JISではない
- ファイルは1枚の表ではなく `■` 始まりの3セクション構造
  1. `■資産合計欄`
  2. `■ 保有商品詳細 (すべて）` ← 本命
  3. `■参考為替レート`
- 数値は `"222,699"` のように**引用符の中にカンマ**が入る。`split(",")` は使えない
- 基準日時はCSV本文に無く、**ファイル名**から取る（`assetbalance(all)_YYYYMMDD_HHmmss.csv`）
- iOS経由でファイル名の括弧が `_` に置換されることがあるため、括弧に依存せず数字部分だけを見る

### 取込フロー
1. `<input type="file" accept=".csv">` でファイル選択
2. `file.text()` で読み込み（UTF-8デコード）
3. `parseRakutenCsv(text, file.name)` でパース
4. 銘柄名で `funds` を照合。未登録なら新規登録を促すUI
5. プレビュー画面で内容を確認 → 確定で `snapshots` に upsert

## 画面構成（4タブ）

### 1. ホーム
- 現在の評価額（大きく）
- 評価損益（円 / ％）— プラスは緑、マイナスは赤
- 元本に対する評価額の割合を進捗バーで表示
- 保有商品の構成比ドーナツグラフ
- 最終更新日

### 2. 推移
- 元本ラインと評価額ラインの2本重ねの折れ線グラフ
- 元本は `contributions` から月ごとに累積計算するので、スナップショットが無い月も線が引ける
- 期間切替: 全期間 / 1年 / 6ヶ月

### 3. 積立
- 現行の積立設定カード（銘柄 / 月額 / 決済方法）
- 月額合計
- 積立履歴タイムライン（`contributions` の `started_on` 順）
  - 例: 2025年8月〜10月 → 月5,000円（オルカン）
- 設定の追加・変更フォーム

### 4. 試算
- 年利スライダー + 期間プリセット
- 予想資産額と元本の内訳
- 注記

## 初期データ（seed）

`funds`:
| name | short_name | color |
|---|---|---|
| eMAXIS Slim 全世界株式(オール・カントリー)(オルカン) | オルカン | #3B82F6 |
| eMAXIS Slim 米国株式(S&P500) | S&P500 | #F97316 |

`contributions` の初期投入は、これまでの積立履歴を手入力する。
推移グラフの過去分は、この積立履歴からの累積元本と、月次で取り込むCSVで埋めていく。

## 実装の進め方

1. Supabaseのテーブル作成 + seed
2. `parseRakutenCsv.ts` を `lib/` に配置
3. モックデータ層（`isSupabaseConfigured()` フォールバック）
4. ホーム画面 → 推移 → 積立 → 試算 の順
5. PWA化（manifest + service worker）
