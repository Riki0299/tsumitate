import { create } from "zustand";
import {
  createContribution,
  createFund,
  deleteContribution as dbDeleteContribution,
  getContributions,
  getFunds,
  getSettings,
  getSnapshots,
  putContribution,
  putSettings,
  upsertSnapshot,
} from "./db";
import { importRakutenCsv, type CsvImportResult } from "./csvImport";
import { restoreBackupFromFile } from "./backup";
import type { Contribution, Fund, Settings, Snapshot } from "./types";

type AppState = {
  funds: Fund[];
  contributions: Contribution[];
  snapshots: Snapshot[];
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  addFund: (input: Omit<Fund, "id">) => Promise<Fund>;
  addContribution: (input: Omit<Contribution, "id">) => Promise<void>;
  stopContribution: (id: string, to: string) => Promise<void>;
  removeContribution: (id: string) => Promise<void>;
  importCsv: (text: string, filename: string) => Promise<CsvImportResult>;
  addManualSnapshot: (input: Omit<Snapshot, "id" | "source">) => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  restoreBackup: (file: File) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  funds: [],
  contributions: [],
  snapshots: [],
  settings: { annualRate: 5, currentAge: null },
  loaded: false,

  load: async () => {
    const [funds, contributions, snapshots, settings] = await Promise.all([
      getFunds(),
      getContributions(),
      getSnapshots(),
      getSettings(),
    ]);
    set({ funds, contributions, snapshots, settings, loaded: true });
  },

  addFund: async (input) => {
    const fund = await createFund(input);
    set({ funds: await getFunds() });
    return fund;
  },

  addContribution: async (input) => {
    await createContribution(input);
    set({ contributions: await getContributions() });
  },

  stopContribution: async (id, to) => {
    const contribution = get().contributions.find((c) => c.id === id);
    if (!contribution) return;
    await putContribution({ ...contribution, to });
    set({ contributions: await getContributions() });
  },

  removeContribution: async (id) => {
    await dbDeleteContribution(id);
    set({ contributions: await getContributions() });
  },

  importCsv: async (text, filename) => {
    const result = await importRakutenCsv(text, filename, get().funds);
    const [funds, snapshots] = await Promise.all([getFunds(), getSnapshots()]);
    set({ funds, snapshots });
    return result;
  },

  addManualSnapshot: async (input) => {
    await upsertSnapshot({ ...input, source: "manual" });
    set({ snapshots: await getSnapshots() });
  },

  updateSettings: async (partial) => {
    const next = { ...get().settings, ...partial };
    await putSettings(next);
    set({ settings: next });
  },

  restoreBackup: async (file) => {
    await restoreBackupFromFile(file);
    await get().load();
  },
}));
