"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { downloadBackup } from "@/lib/backup";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InvestmentPolicyCard } from "@/components/settings/InvestmentPolicyCard";
import { HouseValueCard } from "@/components/settings/HouseValueCard";

type Status = { type: "idle" } | { type: "ok"; message: string } | { type: "error"; message: string };

export default function SettingsPage() {
  const restoreBackup = useAppStore((s) => s.restoreBackup);
  const inputRef = useRef<HTMLInputElement>(null);
  const [exportStatus, setExportStatus] = useState<Status>({ type: "idle" });
  const [importStatus, setImportStatus] = useState<Status>({ type: "idle" });

  async function handleExport() {
    try {
      await downloadBackup();
      setExportStatus({ type: "ok", message: "書き出しました" });
    } catch (err) {
      setExportStatus({
        type: "error",
        message: err instanceof Error ? err.message : "書き出しに失敗しました",
      });
    }
  }

  async function handleImportFile(file: File) {
    if (!confirm("現在の端末内データをすべて置き換えます。よろしいですか？")) return;
    try {
      await restoreBackup(file);
      setImportStatus({ type: "ok", message: "読み込みました" });
    } catch (err) {
      setImportStatus({
        type: "error",
        message: err instanceof Error ? err.message : "読み込みに失敗しました",
      });
    }
  }

  return (
    <div
      className="mx-auto min-h-screen max-w-md px-4 pb-16 pt-6"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <Link href="/home" className="text-sm text-stone-500">
          ← 戻る
        </Link>
        <h1 className="text-lg font-semibold text-stone-100">設定</h1>
      </div>

      <div className="space-y-4">
      <InvestmentPolicyCard />
      <HouseValueCard />

      <Card>
        <SectionLabel>バックアップ</SectionLabel>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          端末内のすべてのデータを1つのJSONファイルとして書き出し・読み込みできます。
          機種変更やブラウザデータ削除の前に書き出しておいてください。
        </p>

        <div className="mt-4 space-y-2">
          <Button variant="primary" className="w-full" onClick={handleExport}>
            データを書き出す
          </Button>
          {exportStatus.type !== "idle" && (
            <p
              className="text-center text-xs"
              style={{ color: exportStatus.type === "ok" ? "#34D399" : "#F87171" }}
            >
              {exportStatus.message}
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <Button className="w-full" onClick={() => inputRef.current?.click()}>
            データを読み込む
          </Button>
          {importStatus.type !== "idle" && (
            <p
              className="text-center text-xs"
              style={{ color: importStatus.type === "ok" ? "#34D399" : "#F87171" }}
            >
              {importStatus.message}
            </p>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
}
