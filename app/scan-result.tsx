import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMealStore } from "@store/mealStore";
import { useAuthStore } from "@store/authStore";
import { useGlucoseStore } from "@store/glucoseStore";
import { saveMealScan } from "@services/supabase";
import { GlassCard } from "@components/GlassCard";
import { GlowButton } from "@components/GlowButton";
import { NutritionBar } from "@components/NutritionBar";
import { Colors } from "@constants/colors";
import { calculateInsulinDose } from "@utils/insulin";

export default function ScanResultScreen() {
  const insets = useSafeAreaInsets();
  const { pendingScan, addScan, setPendingScan } = useMealStore();
  const { profile } = useAuthStore();
  const { currentGlucose } = useGlucoseStore();
  const [saving, setSaving] = useState(false);
  const [glucoseInput, setGlucoseInput] = useState(
    currentGlucose ? String(Math.round(currentGlucose)) : ""
  );

  if (!pendingScan?.nutrition) {
    router.back();
    return null;
  }

  const { imageUri, nutrition } = pendingScan;
  const glucoseValue = parseFloat(glucoseInput) || profile?.target_glucose || 100;

  const insulinResult = calculateInsulinDose({
    carbs: nutrition.carbohydrates,
    currentGlucose: glucoseValue,
    targetGlucose: profile?.target_glucose ?? 100,
    carbRatio: profile?.carb_ratio ?? 15,
    correctionFactor: profile?.correction_factor ?? 50,
  });

  const handleSave = async () => {
    if (!profile) {
      Alert.alert("Not logged in", "Please log in to save meals.");
      return;
    }
    setSaving(true);
    try {
      const saved = await saveMealScan({
        user_id: profile.id,
        image_url: imageUri,
        food_name: nutrition.food_name,
        calories: nutrition.calories,
        carbohydrates: nutrition.carbohydrates,
        sugar: nutrition.sugar,
        protein: nutrition.protein,
        fats: nutrition.fats,
        glycemic_index: nutrition.glycemic_index,
        insulin_dose: insulinResult.totalDose,
      });
      addScan(saved as any);
      setPendingScan(null);
      Alert.alert("Saved!", "Meal has been saved to your history.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/home") },
      ]);
    } catch (e: any) {
      Alert.alert("Save Failed", e.message ?? "Could not save this meal.");
    } finally {
      setSaving(false);
    }
  };

  const giColor = nutrition.glycemic_index > 70 ? Colors.danger : nutrition.glycemic_index > 55 ? Colors.warning : Colors.success;

  return (
    <LinearGradient colors={[Colors.bgPrimary, "#0C1220"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Result</Text>
          <View style={styles.aiTag}>
            <Ionicons name="sparkles" size={12} color={Colors.mintPrimary} />
            <Text style={styles.aiTagText}>AI Analyzed</Text>
          </View>
        </View>

        {/* Food image */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View style={styles.imageCard}>
            <Image source={{ uri: imageUri }} style={styles.foodImage} resizeMode="cover" />
            <LinearGradient
              colors={["transparent", "rgba(10,14,26,0.95)"]}
              style={styles.imageOverlay}
            >
              <Text style={styles.foodName}>{nutrition.food_name}</Text>
              <View style={styles.caloriesBadge}>
                <Ionicons name="flame" size={14} color={Colors.warning} />
                <Text style={styles.caloriesText}>{Math.round(nutrition.calories)} kcal</Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Nutrition macros */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <GlassCard gradient={["rgba(0,212,168,0.06)", "rgba(8,145,178,0.04)"]} borderColor={Colors.borderMint}>
            <Text style={styles.cardTitle}>Nutrition Breakdown</Text>
            <View style={styles.macroGrid}>
              <MacroChip icon="🌾" label="Carbs" value={`${Math.round(nutrition.carbohydrates)}g`} color={Colors.tealLight} />
              <MacroChip icon="🍬" label="Sugar" value={`${Math.round(nutrition.sugar)}g`} color={Colors.mintPrimary} />
              <MacroChip icon="💪" label="Protein" value={`${Math.round(nutrition.protein)}g`} color="#A855F7" />
              <MacroChip icon="🧈" label="Fats" value={`${Math.round(nutrition.fats)}g`} color={Colors.warning} />
            </View>
            <View style={styles.barsSection}>
              <NutritionBar label="Carbohydrates" value={nutrition.carbohydrates} maxValue={100} colors={[Colors.tealLight, Colors.tealPrimary]} icon="🌾" unit="g" />
              <NutritionBar label="Sugar" value={nutrition.sugar} maxValue={50} colors={[Colors.mintLight, Colors.mintPrimary]} icon="🍬" unit="g" />
              <NutritionBar label="Protein" value={nutrition.protein} maxValue={50} colors={["#9333EA", "#A855F7"]} icon="💪" unit="g" />
              <NutritionBar label="Fats" value={nutrition.fats} maxValue={40} colors={[Colors.warningLight, Colors.warning]} icon="🧈" unit="g" />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Glycemic Index */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <GlassCard>
            <View style={styles.giRow}>
              <View>
                <Text style={styles.cardTitle}>Glycemic Index</Text>
                <Text style={styles.giSubtext}>
                  {nutrition.glycemic_index > 70 ? "High — may spike blood sugar quickly" :
                   nutrition.glycemic_index > 55 ? "Medium — moderate glucose impact" :
                   "Low — gentle glucose rise"}
                </Text>
              </View>
              <View style={[styles.giBadge, { backgroundColor: giColor + "20" }]}>
                <Text style={[styles.giValue, { color: giColor }]}>{Math.round(nutrition.glycemic_index)}</Text>
                <Text style={[styles.giLabel, { color: giColor }]}>
                  {nutrition.glycemic_index > 70 ? "HIGH" : nutrition.glycemic_index > 55 ? "MED" : "LOW"}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Insulin Calculator */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <GlassCard gradient={["rgba(168,85,247,0.08)", "rgba(124,58,237,0.05)"]} borderColor="rgba(168,85,247,0.3)">
            <View style={styles.insulinHeader}>
              <LinearGradient colors={["#7C3AED", "#A855F7"]} style={styles.insulinIcon}>
                <Ionicons name="medical" size={16} color="#FFF" />
              </LinearGradient>
              <Text style={styles.cardTitle}>Insulin Recommendation</Text>
            </View>

            {/* Current glucose input */}
            <View style={styles.glucoseInputRow}>
              <Text style={styles.glucoseInputLabel}>Current Glucose (mg/dL)</Text>
              <TextInput
                value={glucoseInput}
                onChangeText={setGlucoseInput}
                keyboardType="numeric"
                placeholder="Enter value"
                placeholderTextColor={Colors.textMuted}
                style={styles.glucoseInput}
                maxLength={4}
              />
            </View>

            <View style={styles.doseBreakdown}>
              <DoseRow label="Meal dose" value={insulinResult.mealDose} unit="U" />
              <DoseRow label="Correction dose" value={insulinResult.correctionDose} unit="U" highlight={insulinResult.correctionDose > 0} />
              <View style={styles.doseDivider} />
              <View style={styles.totalDoseRow}>
                <Text style={styles.totalDoseLabel}>Total Dose</Text>
                <LinearGradient colors={["#7C3AED", Colors.mintPrimary]} style={styles.totalDoseBadge}>
                  <Text style={styles.totalDoseValue}>{insulinResult.totalDose}U</Text>
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.insulinRec}>{insulinResult.recommendation}</Text>

            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={14} color={Colors.warning} />
              <Text style={styles.warningText}>{insulinResult.warning}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.actions}>
          <GlowButton title="Save Meal" onPress={handleSave} loading={saving} size="lg" />
          <GlowButton
            title="Discard"
            variant="ghost"
            onPress={() => {
              setPendingScan(null);
              router.back();
            }}
            size="md"
          />
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

function MacroChip({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[styles.macroChip, { borderColor: color + "30", backgroundColor: color + "10" }]}>
      <Text style={styles.macroChipIcon}>{icon}</Text>
      <Text style={[styles.macroChipValue, { color }]}>{value}</Text>
      <Text style={styles.macroChipLabel}>{label}</Text>
    </View>
  );
}

function DoseRow({ label, value, unit, highlight }: { label: string; value: number; unit: string; highlight?: boolean }) {
  return (
    <View style={styles.doseRow}>
      <Text style={styles.doseLabel}>{label}</Text>
      <Text style={[styles.doseValue, highlight && { color: Colors.warning }]}>
        {value > 0 ? `+${value}` : value}{unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
  aiTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.mintPrimary + "15", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  aiTagText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.mintPrimary },
  imageCard: { borderRadius: 20, overflow: "hidden", height: 220 },
  foodImage: { width: "100%", height: "100%" },
  imageOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, gap: 8 },
  foodName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF" },
  caloriesBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  caloriesText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.warning },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF", marginBottom: 14 },
  macroGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  macroChip: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  macroChipIcon: { fontSize: 18 },
  macroChipValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  macroChipLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  barsSection: { gap: 14 },
  giRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  giSubtext: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 4, maxWidth: 200 },
  giBadge: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", gap: 2 },
  giValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  giLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  insulinHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  insulinIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  glucoseInputRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  glucoseInputLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  glucoseInput: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.mintPrimary, textAlign: "right", minWidth: 70 },
  doseBreakdown: { gap: 10, marginBottom: 14 },
  doseRow: { flexDirection: "row", justifyContent: "space-between" },
  doseLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  doseValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary },
  doseDivider: { height: 0.5, backgroundColor: "rgba(255,255,255,0.1)" },
  totalDoseRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalDoseLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  totalDoseBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  totalDoseValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  insulinRec: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  warningBox: { flexDirection: "row", gap: 8, backgroundColor: Colors.warning + "15", borderRadius: 10, padding: 12, alignItems: "flex-start" },
  warningText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.warning, lineHeight: 18 },
  actions: { gap: 10 },
});
