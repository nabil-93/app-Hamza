import { create } from "zustand";
import type { MealScan } from "@services/supabase";

export interface NutritionResult {
  food_name: string;
  calories: number;
  carbohydrates: number;
  sugar: number;
  protein: number;
  fats: number;
  glycemic_index: number;
}

interface MealState {
  scans: MealScan[];
  pendingScan: {
    imageUri: string;
    nutrition: NutritionResult | null;
    insulinDose: number;
  } | null;
  isAnalyzing: boolean;
  isLoading: boolean;

  setScans: (scans: MealScan[]) => void;
  addScan: (scan: MealScan) => void;
  removeScan: (id: string) => void;
  setPendingScan: (data: MealState["pendingScan"]) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setLoading: (loading: boolean) => void;
  getTodayCalories: () => number;
  getTodayCarbs: () => number;
}

export const useMealStore = create<MealState>((set, get) => ({
  scans: [],
  pendingScan: null,
  isAnalyzing: false,
  isLoading: false,

  setScans: (scans) => set({ scans }),

  addScan: (scan) =>
    set((state) => ({ scans: [scan, ...state.scans] })),

  removeScan: (id) =>
    set((state) => ({ scans: state.scans.filter((s) => s.id !== id) })),

  setPendingScan: (data) => set({ pendingScan: data }),

  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  setLoading: (loading) => set({ isLoading: loading }),

  getTodayCalories: () => {
    const { scans } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return scans
      .filter((s) => new Date(s.created_at) >= today)
      .reduce((sum, s) => sum + s.calories, 0);
  },

  getTodayCarbs: () => {
    const { scans } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return scans
      .filter((s) => new Date(s.created_at) >= today)
      .reduce((sum, s) => sum + s.carbohydrates, 0);
  },
}));
