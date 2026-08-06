"use client";

import { useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { formatYearMonthLabel } from "@/lib/format";

type ImportStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "done"; yearMonth: string; count: number; newFundCount: number }
  | { state: "error"; message: string };

export function CsvImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const importCsv = useAppStore((s) => s.importCsv);
  const [status, setStatus] = useState<ImportStatus>({ state: "idle" });

  async function handleFile(file: File) {
    setStatus({ state: "loading" });
    try {
      const text = await file.text();
      const result = await importCsv(text, file.name);
      setStatus({
        state: "done",
        yearMonth: result.yearMonth,
        count: result.snapshots.length,
        newFundCount: result.newFunds.length,
      });
    } catch (err) {
      setStatus({
        state: "error",
        message: err instanceof Error ? err.message : "取込に失敗しました",
      });
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <Button
        variant="primary"
        className="w-full"
        disabled={status.state === "loading"}
        onClick={() => inputRef.current?.click()}
      >
        {status.state === "loading" ? "取込中..." : "CSVを取り込む"}
      </Button>

      {status.state === "done" && (
        <p className="mt-2 text-center text-xs text-positive">
          {formatYearMonthLabel(status.yearMonth)}分を{status.count}件取り込みました
          {status.newFundCount > 0 && `（新規銘柄 ${status.newFundCount}件）`}
        </p>
      )}
      {status.state === "error" && (
        <p className="mt-2 text-center text-xs text-negative">{status.message}</p>
      )}
    </div>
  );
}
