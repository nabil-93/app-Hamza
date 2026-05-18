import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signUp } from "@services/supabase";
import { GlowButton } from "@components/GlowButton";
import { InputField } from "@components/InputField";
import { Colors } from "@constants/colors";
import { DIABETES_TYPES } from "@constants/index";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [diabetesType, setDiabetesType] = useState<string>("type1");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, name.trim());
      router.replace("/onboarding");
    } catch (e: any) {
      Alert.alert("Registration Failed", e.message ?? "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.bgPrimary, "#0D1424", Colors.bgPrimary]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
            <LinearGradient colors={[Colors.mintLight, Colors.mintPrimary, Colors.tealPrimary]} style={styles.icon}>
              <Ionicons name="person-add" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your AI diabetes journey</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
            <View style={styles.fields}>
              <InputField label="Full Name" placeholder="Your name" value={name} onChangeText={setName} leftIcon="person-outline" autoCapitalize="words" />
              <InputField label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
              <InputField label="Password" placeholder="Min. 8 characters" value={password} onChangeText={setPassword} isPassword leftIcon="lock-closed-outline" />
              <InputField label="Confirm Password" placeholder="Repeat password" value={confirmPassword} onChangeText={setConfirmPassword} isPassword leftIcon="lock-closed-outline" />
            </View>

            {/* Diabetes type selector */}
            <View style={styles.typeSection}>
              <Text style={styles.typeLabel}>Diabetes Type</Text>
              <View style={styles.typeGrid}>
                {DIABETES_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setDiabetesType(t.value)}
                    style={[styles.typeChip, diabetesType === t.value && styles.typeChipActive]}
                  >
                    <Text style={[styles.typeChipText, diabetesType === t.value && styles.typeChipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <GlowButton title="Create Account" onPress={handleRegister} loading={loading} size="lg" style={{ marginTop: 4 }} />
          </Animated.View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, gap: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  header: { alignItems: "center", gap: 10 },
  icon: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.mintPrimary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFF" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  card: {
    backgroundColor: "rgba(20,27,45,0.9)", borderRadius: 24, padding: 24,
    borderWidth: 0.8, borderColor: Colors.bgGlassBorder, gap: 18,
  },
  fields: { gap: 14 },
  typeSection: { gap: 10 },
  typeLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  typeChipActive: {
    borderColor: Colors.mintPrimary,
    backgroundColor: "rgba(0,212,168,0.1)",
  },
  typeChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.mintPrimary },
  loginRow: { flexDirection: "row", justifyContent: "center" },
  loginText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  loginLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.mintPrimary },
});
