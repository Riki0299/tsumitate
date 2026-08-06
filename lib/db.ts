import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Contribution, Fund, Settings, Snapshot } from "./types";

const DB_NAME = "tsumitate";
const DB_VERSION = 1;

interface TsumitateDB extends DBSchema {
  funds: {
    key: string;
    value: Fund;
  };
  contributions: {
    key: string;
    value: Contribution;
    indexes: { fundId: string };
  };
  snapshots: {
    key: string;
    value: Snapshot;
    indexes: { yearMonth: string; yearMonth_fundId: [string, string] };
  };
  settings: {
    key: string;
    value: Settings;
  };
}

const SETTINGS_KEY = "default";
const DEFAULT_SETTINGS: Settings = {
  annualRate: 5,
  currentAge: null,
  investmentStartMonth: null,
  principles: [],
  goal: "",
};

let dbPromise: Promise<IDBPDatabase<TsumitateDB>> | null = null;

function getDb(): Promise<IDBPDatabase<TsumitateDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TsumitateDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("funds", { keyPath: "id" });

        const contributions = db.createObjectStore("contributions", {
          keyPath: "id",
        });
        contributions.createIndex("fundId", "fundId");

        const snapshots = db.createObjectStore("snapshots", {
          keyPath: "id",
        });
        snapshots.createIndex("yearMonth", "yearMonth");
        snapshots.createIndex("yearMonth_fundId", ["yearMonth", "fundId"], {
          unique: true,
        });

        db.createObjectStore("settings", { keyPath: "__key" });
      },
    });
  }
  return dbPromise;
}

function newId(): string {
  return crypto.randomUUID();
}

/* ------------------------------------------------------------------ */
/* funds                                                               */
/* ------------------------------------------------------------------ */

export async function getFunds(): Promise<Fund[]> {
  const db = await getDb();
  return db.getAll("funds");
}

export async function getFund(id: string): Promise<Fund | undefined> {
  const db = await getDb();
  return db.get("funds", id);
}

export async function findFundByName(name: string): Promise<Fund | undefined> {
  const funds = await getFunds();
  return funds.find((f) => f.name === name);
}

export async function putFund(fund: Fund): Promise<void> {
  const db = await getDb();
  await db.put("funds", fund);
}

export async function createFund(input: Omit<Fund, "id">): Promise<Fund> {
  const fund: Fund = { ...input, id: newId() };
  await putFund(fund);
  return fund;
}

/* ------------------------------------------------------------------ */
/* contributions                                                       */
/* ------------------------------------------------------------------ */

export async function getContributions(): Promise<Contribution[]> {
  const db = await getDb();
  return db.getAll("contributions");
}

export async function putContribution(c: Contribution): Promise<void> {
  const db = await getDb();
  await db.put("contributions", c);
}

export async function createContribution(
  input: Omit<Contribution, "id">,
): Promise<Contribution> {
  const c: Contribution = { ...input, id: newId() };
  await putContribution(c);
  return c;
}

export async function deleteContribution(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("contributions", id);
}

/* ------------------------------------------------------------------ */
/* snapshots                                                           */
/* ------------------------------------------------------------------ */

export async function getSnapshots(): Promise<Snapshot[]> {
  const db = await getDb();
  return db.getAll("snapshots");
}

export async function getSnapshotsByMonth(
  yearMonth: string,
): Promise<Snapshot[]> {
  const db = await getDb();
  return db.getAllFromIndex("snapshots", "yearMonth", yearMonth);
}

/**
 * yearMonth + fundId で一意。既存があれば上書き、無ければ新規作成する。
 */
export async function upsertSnapshot(
  input: Omit<Snapshot, "id">,
): Promise<Snapshot> {
  const db = await getDb();
  const existing = await db.getFromIndex("snapshots", "yearMonth_fundId", [
    input.yearMonth,
    input.fundId,
  ]);
  const snapshot: Snapshot = { ...input, id: existing?.id ?? newId() };
  await db.put("snapshots", snapshot);
  return snapshot;
}

export async function deleteSnapshot(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("snapshots", id);
}

/* ------------------------------------------------------------------ */
/* settings                                                             */
/* ------------------------------------------------------------------ */

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await db.get("settings", SETTINGS_KEY);
  return row ? { ...DEFAULT_SETTINGS, ...row } : DEFAULT_SETTINGS;
}

export async function putSettings(settings: Settings): Promise<void> {
  const db = await getDb();
  await db.put("settings", { ...settings, __key: SETTINGS_KEY } as never);
}

/* ------------------------------------------------------------------ */
/* backup / restore                                                    */
/* ------------------------------------------------------------------ */

export type BackupData = {
  version: 1;
  exportedAt: string;
  funds: Fund[];
  contributions: Contribution[];
  snapshots: Snapshot[];
  settings: Settings;
};

export async function exportAllData(): Promise<BackupData> {
  const [funds, contributions, snapshots, settings] = await Promise.all([
    getFunds(),
    getContributions(),
    getSnapshots(),
    getSettings(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    funds,
    contributions,
    snapshots,
    settings,
  };
}

export async function importAllData(data: BackupData): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    ["funds", "contributions", "snapshots", "settings"],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore("funds").clear(),
    tx.objectStore("contributions").clear(),
    tx.objectStore("snapshots").clear(),
    tx.objectStore("settings").clear(),
  ]);
  await Promise.all([
    ...data.funds.map((f) => tx.objectStore("funds").put(f)),
    ...data.contributions.map((c) => tx.objectStore("contributions").put(c)),
    ...data.snapshots.map((s) => tx.objectStore("snapshots").put(s)),
    tx.objectStore("settings").put({ ...data.settings, __key: SETTINGS_KEY } as never),
  ]);
  await tx.done;
}
