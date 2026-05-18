import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@store/authStore";
import { upsertUserProfile } from "@services/supabase";
import { GlassCard } from "@components/GlassCard";
import { GlowButton } from "@components/GlowButton";
import { Colors } from "@constants/colors";
import { DIABETES_TYPES, DEFAULT_PROFILE } from "@constants/index";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, setProfile, logout } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    diabetes_type: profile?.diabetes_type ?? "type1",
    carb_ratio: String(profile?.carb_ratio ?? DEFAULT_PROFILE.carbRatio),
    correction_factor: String(profile?.correction_factor ?? DEFAULT_PROFILE.correctionFactor),
    target_glucose: String(profile?.target_glucose ?? DEFAULT_PROFILE.targetGlucose),
    emergency_contact: profile?.emergency_contact ?? "",
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await upsertUserProfile({
        id: user.id,
        email: user.email ?? "",
        full_name: form.full_name,
        diabetes_type: form.diabetes_type as any,
        carb_ratio: parseFloat(form.carb_ratio) || DEFAULT_PROFILE.carbRatio,
        correction_factor: parseFloat(form.correction_factor) || DEFAULT_PROFILE.correctionFactor,
        target_glucose: parseFloat(form.target_glucose) || DEFAULT_PROFILE.targetGlucose,
        emergency_contact: form.emergency_contact,
      } as any);
      setProfile(updated as any);
      setEditing(false);
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "User";

  return (
    <LinearGradient colors={[Colors.bgPrimary, "#0C1220", Colors.bgPrimary]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editBtn}>
            <Ionicons name={editing ? "close" : "pencil"} size={17} color={Colors.mintPrimary} />
            <Text style={styles.editBtnText}>{editing ? "Cancel" : "Edit"}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Avatar */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.avatarSection}>
          <LinearGradient colors={[Colors.mintLight, Colors.mintPrimary, Colors.tealPrimary]} style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.avatarInfo}>
            <Text style={styles.name}>{profile?.full_name ?? "Set your name"}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={[styles.typeBadge, { borderColor: Colors.mintPrimary + "40" }]}>
              <Text style={styles.typeText}>
                {DIABETES_TYPES.find((t) => t.value === profile?.diabetes_type)?.label ?? "Diabetes Type"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Personal info */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <GlassCard>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <ProfileField
              label="Full Name"
              value={editing ? form.full_name : profile?.full_name ?? "Not set"}
              editing={editing}
              onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
              icon="person-outline"
            />
            {editing && (
              <View style={styles.typeSelector}>
                <Text style={styles.fieldLabel}>Diabetes Type</Text>
                <View style={styles.typeGrid}>
                  {DIABETES_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      onPress={() => setForm((f) => ({ ...f, diabetes_type: t.value }))}
                      style={[styles.typeChip, form.diabetes_type === t.value && styles.typeChipActive]}
                    >
                      <Text style={[styles.typeChipText, form.diabetes_type === t.value && styles.typeChipTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Insulin settings */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <GlassCard gradient={["rgba(168,85,247,0.06)", "rgba(124,58,237,0.04)"]} borderColor="rgba(168,85,247,0.2)">
            <View style={styles.sectionHeader}>
              <LinearGradient colors={["#7C3AED", "#A855F7"]} style={styles.sectionIcon}>
                <Ionicons name="medical" size={14} color="#FFF" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Insulin Settings</Text>
            </View>

            <ProfileField
              label="Carb Ratio (g/U)"
              value={editing ? form.carb_ratio : `${profile?.carb_ratio ?? DEFAULT_PROFILE.carbRatio} g per unit`}
              editing={editing}
              onChangeText={(v) => setForm((f) => ({ ...f, carb_ratio: v }))}
              icon="nutrition-outline"
              keyboardType="decimal-pad"
              hint="How many grams of carbs are covered by 1 unit of insulin"
            />
            <ProfileField
              label="Correction Factor (mg/dL per U)"
              value={editing ? form.correction_factor : `${profile?.correction_factor ?? DEFAULT_PROFILE.correctionFactor} mg/dL per unit`}
              editing={editing}
              onChangeText={(v) => setForm((f) => ({ ...f, correction_factor: v }))}
              icon="calculator-outline"
              keyboardType="decimal-pad"
              hint="How much 1 unit of insulin lowers your glucose"
            />
            <ProfileField
              label="Target Glucose (mg/dL)"
              value={editing ? form.target_glucose : `${profile?.target_glucose ?? DEFAULT_PROFILE.targetGlucose} mg/dL`}
              editing={editing}
              onChangeText={(v) => setForm((f) => ({ ...f, target_glucose: v }))}
              icon="checkmark-circle-outline"
              keyboardType="decimal-pad"
              hint="Your ideal blood glucose target"
            />

            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={13} color={Colors.warning} />
              <Text style={styles.warningText}>
                Always confirm insulin settings with your healthcare provider.
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Emergency contact */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <GlassCard gradient={["rgba(255,68,68,0.05)", "rgba(255,107,107,0.03)"]} borderColor="rgba(255,68,68,0.2)">
            <View style={styles.sectionHeader}>
              <LinearGradient colors={[Colors.danger, Colors.dangerLight]} style={styles.sectionIcon}>
                <Ionicons name="call" size={14} color="#FFF" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Emergency Contact</Text>
            </View>
            <ProfileField
              label="Phone Number"
              value={editing ? form.emergency_contact : profile?.emergency_contact ?? "Not set"}
              editing={editing}
              onChangeText={(v) => setForm((f) => ({ ...f, emergency_contact: v }))}
              icon="call-outline"
              keyboardType="phone-pad"
              hint="Used for emergency glucose alerts"
            />
            <TouchableOpacity onPress={() => router.push("/emergency")} style={styles.emergencyBtn}>
              <LinearGradient colors={[Colors.danger, Colors.dangerLight]} style={styles.emergencyBtnGrad}>
                <Ionicons name="warning" size={16} color="#FFF" />
                <Text style={styles.emergencyBtnText}>Emergency Panel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* Save button */}
        {editing && (
          <Animated.View entering={FadeInDown.springify()}>
            <GlowButton title="Save Changes" onPress={handleSave} loading={saving} size="lg" />
          </Animated.View>
        )}

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <GlowButton title="Sign Out" onPress={handleLogout} variant="outline" size="md" />
        </Animated.View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>GlucoAI v1.0.0 · Powered by GPT-4o</Text>
          <Text style={styles.appInfoText}>Always consult your healthcare provider</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function ProfileField({
  label,
  value,
  editing,
  onChangeText,
  icon,
  keyboardType,
  hint,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChangeText: (v: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  keyboardType?: any;
  hint?: string;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        {icon && <Ionicons name={icon} size={15} color={Colors.textMuted} />}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {editing ? (
        <View>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            style={styles.fieldInput}
            placeholderTextColor={Colors.textMuted}
            keyboardType={keyboardType}
            selectionColor={Colors.mintPrimary}
          />
          {hint && <Text style={styles.fieldHint}>{hint}</Text>}
        </View>
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#FFF" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.mintPrimary + "15", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  editBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.mintPrimary },
  avatarSection: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", shadowColor: Colors.mintPrimary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#FFF" },
  avatarInfo: { gap: 4 },
  name: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFF" },
  email: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  typeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: Colors.mintPrimary + "10", marginTop: 4 },
  typeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.mintPrimary },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  field: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.06)", gap: 6 },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValue: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#FFF" },
  fieldInput: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.mintPrimary, backgroundColor: "rgba(0,212,168,0.06)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 0.5, borderColor: Colors.borderMint },
  fieldHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 4 },
  typeSelector: { paddingVertical: 12, gap: 10, borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.06)" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)" },
  typeChipActive: { borderColor: Colors.mintPrimary, backgroundColor: Colors.mintPrimary + "15" },
  typeChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.mintPrimary },
  warningBox: { flexDirection: "row", gap: 8, backgroundColor: Colors.warning + "12", borderRadius: 10, padding: 10, alignItems: "center", marginTop: 12 },
  warningText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.warning, lineHeight: 16 },
  emergencyBtn: { marginTop: 12, borderRadius: 12, overflow: "hidden" },
  emergencyBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  emergencyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  appInfo: { alignItems: "center", gap: 4, paddingVertical: 8 },
  appInfoText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});
