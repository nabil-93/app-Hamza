import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resetPassword } from "@services/supabase";
import { GlowButton } from "@components/GlowButton";
import { InputField } from "@components/InputField";
import { Colors } from "@constants/colors";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.bgPrimary, "#0D1424", Colors.bgPrimary]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.content}>
          {sent ? (
            <>
              <LinearGradient colors={[Colors.mintLight, Colors.mintPrimary]} style={styles.icon}>
                <Ionicons name="checkmark" size={32} color="#FFF" />
              </LinearGradient>
              <Text style={styles.title}>Email Sent!</Text>
              <Text style={styles.subtitle}>
                We sent a password reset link to{"\n"}
                <Text style={{ color: Colors.mintPrimary }}>{email}</Text>
              </Text>
              <GlowButton title="Back to Login" onPress={() => router.push("/(auth)/login")} size="lg" style={{ marginTop: 24 }} />
            </>
          ) : (
            <>
              <LinearGradient colors={[Colors.mintLight, Colors.mintPrimary]} style={styles.icon}>
                <Ionicons name="key" size={28} color="#FFF" />
              </LinearGradient>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your email and we'll send you reset instructions.
              </Text>
              <View style={styles.card}>
                <InputField
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                />
                <GlowButton title="Send Reset Link" onPress={handleReset} loading={loading} size="lg" style={{ marginTop: 8 }} />
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 40,
  },
  content: { alignItems: "center", gap: 16 },
  icon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.mintPrimary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
    marginBottom: 8,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFF" },
  subtitle: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary,
    textAlign: "center", lineHeight: 22,
  },
  card: {
    width: "100%", backgroundColor: "rgba(20,27,45,0.9)", borderRadius: 24,
    padding: 24, borderWidth: 0.8, borderColor: Colors.bgGlassBorder, gap: 14, marginTop: 8,
  },
});
