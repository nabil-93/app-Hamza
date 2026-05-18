export * from "./colors";
export * from "./typography";
export * from "./spacing";

export const APP_NAME = "GlucoAI";

export const GLUCOSE_RANGES = {
  low: { min: 0, max: 70, label: "Low", color: "#FF4444" },
  normal: { min: 70, max: 140, label: "Normal", color: "#00D4A8" },
  elevated: { min: 140, max: 180, label: "Elevated", color: "#FFB800" },
  high: { min: 180, max: 999, label: "High", color: "#FF4444" },
} as const;

export const DIABETES_TYPES = [
  { value: "type1", label: "Type 1" },
  { value: "type2", label: "Type 2" },
  { value: "gestational", label: "Gestational" },
  { value: "prediabetes", label: "Prediabetes" },
] as const;

export const DEFAULT_PROFILE = {
  carbRatio: 15,
  correctionFactor: 50,
  targetGlucose: 100,
  diabetesType: "type1",
} as const;
