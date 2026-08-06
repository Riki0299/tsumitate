import { exportAllData, importAllData, type BackupData } from "./db";

export async function downloadBackup(): Promise<void> {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = data.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `tsumitate-backup_${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isBackupData(value: unknown): value is BackupData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.funds) &&
    Array.isArray(v.contributions) &&
    Array.isArray(v.snapshots) &&
    typeof v.settings === "object" &&
    v.settings !== null
  );
}

export async function restoreBackupFromFile(file: File): Promise<void> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!isBackupData(parsed)) {
    throw new Error("バックアップファイルの形式が正しくありません");
  }
  await importAllData(parsed);
}
