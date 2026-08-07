import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Contribution, Fund, Loan, Settings, Snapshot } from "./types";

const DB_NAME = "tsumitate";
const DB_VERSION = 2;

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
  loan: {
    key: string;
    value: Loan;
  };
}

const SETTINGS_KEY = "default";
const DEFAULT_SETTINGS: Settings = {
  annualRate: 5,
  currentAge: null,
  investmentStartMonth: null,
  principles: [],
  goal: "",
  houseInitialValue: null,
  houseDepreciationRate: 1.5,
  includeHouseValueInNetWorth: true,
};

const LOAN_KEY = "default";

let dbPromise: Promise<IDBPDatabase<TsumitateDB>> | null = null;

function getDb(): Promise<IDBPDatabase<TsumitateDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TsumitateDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("funds")) {
          db.createObjectStore("funds", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("contributions")) {
          const contributions = db.createObjectStore("contributions", {
            keyPath: "id",
          });
          contributions.createIndex("fundId", "fundId");
        }

        if (!db.objectStoreNames.contains("snapshots")) {
          const snapshots = db.createObjectStore("snapshots", {
            keyPath: "id",
          });
          snapshots.createIndex("yearMonth", "yearMonth");
          snapshots.createIndex("yearMonth_fundId", ["yearMonth", "fundId"], {
            unique: true,
          });
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "__key" });
        }

        if (!db.objectStoreNames.contains("loan")) {
          db.createObjectStore("loan", { keyPath: "__key" });
        }
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
/* loan                                                                 */
/* ------------------------------------------------------------------ */

export async function getLoan(): Promise<Loan | null> {
  const db = await getDb();
  const row = await db.get("loan", LOAN_KEY);
  return row ?? null;
}

export async function putLoan(loan: Loan): Promise<void> {
  const db = await getDb();
  await db.put("loan", { ...loan, __key: LOAN_KEY } as never);
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
  loan: Loan | null;
};

export async function exportAllData(): Promise<BackupData> {
  const [funds, contributions, snapshots, settings, loan] = await Promise.all([
    getFunds(),
    getContributions(),
    getSnapshots(),
    getSettings(),
    getLoan(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    funds,
    contributions,
    snapshots,
    settings,
    loan,
  };
}

export async function importAllData(data: BackupData): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    ["funds", "contributions", "snapshots", "settings", "loan"],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore("funds").clear(),
    tx.objectStore("contributions").clear(),
    tx.objectStore("snapshots").clear(),
    tx.objectStore("settings").clear(),
    tx.objectStore("loan").clear(),
  ]);
  await Promise.all([
    ...data.funds.map((f) => tx.objectStore("funds").put(f)),
    ...data.contributions.map((c) => tx.objectStore("contributions").put(c)),
    ...data.snapshots.map((s) => tx.objectStore("snapshots").put(s)),
    tx.objectStore("settings").put({ ...data.settings, __key: SETTINGS_KEY } as never),
    ...(data.loan
      ? [tx.objectStore("loan").put({ ...data.loan, __key: LOAN_KEY } as never)]
      : []),
  ]);
  await tx.done;
}
