import { create } from "zustand";
import {
  createContribution,
  createFund,
  deleteContribution as dbDeleteContribution,
  getContributions,
  getFunds,
  getLoan,
  getSettings,
  getSnapshots,
  putContribution,
  putLoan,
  putSettings,
  upsertSnapshot,
} from "./db";
import { importRakutenCsv, type CsvImportResult } from "./csvImport";
import { restoreBackupFromFile } from "./backup";
import { seedInitialDataIfEmpty } from "./seed";
import type { Contribution, Fund, Loan, Settings, Snapshot } from "./types";

type AppState = {
  funds: Fund[];
  contributions: Contribution[];
  snapshots: Snapshot[];
  settings: Settings;
  loan: Loan | null;
  loaded: boolean;
  load: () => Promise<void>;
  addFund: (input: Omit<Fund, "id">) => Promise<Fund>;
  addContribution: (input: Omit<Contribution, "id">) => Promise<void>;
  stopContribution: (id: string, to: string) => Promise<void>;
  removeContribution: (id: string) => Promise<void>;
  importCsv: (text: string, filename: string) => Promise<CsvImportResult>;
  addManualSnapshot: (input: Omit<Snapshot, "id" | "source">) => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  updateLoan: (loan: Loan) => Promise<void>;
  restoreBackup: (file: File) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  funds: [],
  contributions: [],
  snapshots: [],
  settings: {
    annualRate: 5,
    currentAge: null,
    investmentStartMonth: null,
    principles: [],
    goal: "",
    houseInitialValue: null,
    houseDepreciationRate: 1.5,
    includeHouseValueInNetWorth: true,
  },
  loan: null,
  loaded: false,

  load: async () => {
    await seedInitialDataIfEmpty();
    const [funds, contributions, snapshots, settings, loan] = await Promise.all([
      getFunds(),
      getContributions(),
      getSnapshots(),
      getSettings(),
      getLoan(),
    ]);
    set({ funds, contributions, snapshots, settings, loan, loaded: true });
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

  updateLoan: async (loan) => {
    await putLoan(loan);
    set({ loan });
  },

  restoreBackup: async (file) => {
    await restoreBackupFromFile(file);
    await get().load();
  },
}));
