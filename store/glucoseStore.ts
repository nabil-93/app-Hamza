import { create } from "zustand";
import type { GlucoseLog } from "@services/supabase";

interface GlucoseState {
  logs: GlucoseLog[];
  currentGlucose: number | null;
  isLoading: boolean;

  setLogs: (logs: GlucoseLog[]) => void;
  addLog: (log: GlucoseLog) => void;
  setCurrentGlucose: (value: number) => void;
  setLoading: (loading: boolean) => void;
  getAverageGlucose: () => number | null;
  getTodayLogs: () => GlucoseLog[];
}

export const useGlucoseStore = create<GlucoseState>((set, get) => ({
  logs: [],
  currentGlucose: null,
  isLoading: false,

  setLogs: (logs) => {
    const latest = logs[logs.length - 1];
    set({ logs, currentGlucose: latest?.value ?? null });
  },

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log],
      currentGlucose: log.value,
    })),

  setCurrentGlucose: (value) => set({ currentGlucose: value }),

  setLoading: (loading) => set({ isLoading: loading }),

  getAverageGlucose: () => {
    const { logs } = get();
    if (logs.length === 0) return null;
    return Math.round(logs.reduce((sum, l) => sum + l.value, 0) / logs.length);
  },

  getTodayLogs: () => {
    const { logs } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return logs.filter((l) => new Date(l.created_at) >= today);
  },
}));
