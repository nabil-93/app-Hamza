import { useState } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@store/authStore";
import { useGlucoseStore } from "@store/glucoseStore";
import { saveGlucoseLog } from "@services/supabase";

export function useGlucoseInput() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { addLog } = useGlucoseStore();

  const logGlucose = async (value: number, notes?: string) => {
    if (!user) return;
    if (value < 20 || value > 700) {
      Alert.alert("Invalid Value", "Please enter a glucose value between 20 and 700 mg/dL.");
      return;
    }
    setLoading(true);
    try {
      const log = await saveGlucoseLog({
        user_id: user.id,
        value,
        unit: "mg/dL",
        notes,
      });
      addLog(log as any);
      return log;
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to save glucose reading.");
    } finally {
      setLoading(false);
    }
  };

  return { logGlucose, loading };
}
