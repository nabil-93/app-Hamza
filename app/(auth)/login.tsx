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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signIn } from "@services/supabase";
import { GlowButton } from "@components/GlowButton";
import { InputField } from "@components/InputField";
import { Colors } from "@constants/colors";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      Alert.alert("Login Failed", e.message ?? "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.bgPrimary, "#0D1424", Colors.bgPrimary]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoSection}>
            <LinearGradient
              colors={[Colors.mintLight, Colors.mintPrimary, Colors.tealPrimary]}
              style={styles.logoCircle}
            >
              <Ionicons name="pulse" size={36} color="#FFF" />
            </LinearGradient>
            <Text style={styles.appName}>GlucoAI</Text>
            <Text style={styles.tagline}>Your AI Diabetes Companion</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.fields}>
              <InputField
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />
              <InputField
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon="lock-closed-outline"
              />
            </View>

            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")} style={styles.forgotLink}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <GlowButton title="Sign In" onPress={handleLogin} loading={loading} size="lg" style={{ marginTop: 8 }} />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social login */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="logo-google" size={20} color="#FFF" />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="logo-apple" size={20} color="#FFF" />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Register link */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, gap: 24 },
  logoSection: { alignItems: "center", gap: 12, marginBottom: 8 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.mintPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_800ExtraBold",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: "rgba(20,27,45,0.9)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 0.8,
    borderColor: Colors.bgGlassBorder,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: -8,
  },
  fields: { gap: 14 },
  forgotLink: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.mintPrimary },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerText: { fontSize: 13, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  socialText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#FFF" },
  registerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  registerText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  registerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.mintPrimary },
});
