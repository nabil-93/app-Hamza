export interface InsulinParams {
  carbs: number;
  currentGlucose: number;
  targetGlucose: number;
  carbRatio: number;
  correctionFactor: number;
}

export interface InsulinResult {
  totalDose: number;
  mealDose: number;
  correctionDose: number;
  recommendation: string;
  warning: string;
}

export const calculateInsulinDose = (params: InsulinParams): InsulinResult => {
  const { carbs, currentGlucose, targetGlucose, carbRatio, correctionFactor } = params;

  const mealDose = carbs / carbRatio;
  const correctionDose = (currentGlucose - targetGlucose) / correctionFactor;
  const totalDose = Math.max(0, mealDose + correctionDose);

  const roundedTotal = Math.round(totalDose * 2) / 2;

  let recommendation = "";
  if (roundedTotal === 0) {
    recommendation = "No insulin needed for this meal based on your current glucose.";
  } else if (roundedTotal < 2) {
    recommendation = `Consider ${roundedTotal}U — a small correction may be sufficient.`;
  } else {
    recommendation = `Estimated dose: ${roundedTotal}U (${mealDose.toFixed(1)}U meal + ${correctionDose.toFixed(1)}U correction).`;
  }

  return {
    totalDose: roundedTotal,
    mealDose: Math.round(mealDose * 10) / 10,
    correctionDose: Math.round(correctionDose * 10) / 10,
    recommendation,
    warning:
      "⚠️ This is an estimate only — not medical advice. Always consult your healthcare provider for your personalized insulin regimen.",
  };
};

export const getGlucoseStatus = (value: number): {
  label: string;
  color: string;
  bgColor: string;
  isAlert: boolean;
} => {
  if (value < 54) return { label: "Critical Low", color: "#FF4444", bgColor: "rgba(255,68,68,0.15)", isAlert: true };
  if (value < 70) return { label: "Low", color: "#FF6B6B", bgColor: "rgba(255,107,107,0.15)", isAlert: true };
  if (value <= 140) return { label: "Normal", color: "#00D4A8", bgColor: "rgba(0,212,168,0.15)", isAlert: false };
  if (value <= 180) return { label: "Elevated", color: "#FFB800", bgColor: "rgba(255,184,0,0.15)", isAlert: false };
  if (value <= 250) return { label: "High", color: "#FF8C00", bgColor: "rgba(255,140,0,0.15)", isAlert: true };
  return { label: "Critical High", color: "#FF4444", bgColor: "rgba(255,68,68,0.15)", isAlert: true };
};
