import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Vibration,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@store/authStore";
import { useGlucoseStore } from "@store/glucoseStore";
import { Colors } from "@constants/colors";
import { getGlucoseStatus } from "@utils/insulin";
import * as Haptics from "expo-haptics";

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { currentGlucose } = useGlucoseStore();

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Vibration.vibrate([0, 300, 100, 300]);

    pulseScale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.3, { duration: 600 })),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const glucoseStatus = currentGlucose ? getGlucoseStatus(currentGlucose) : null;
  const isEmergency = glucoseStatus?.isAlert ?? false;

  const callEmergency = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Call Emergency Services?",
      "This will dial emergency services (911).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call 911",
          style: "destructive",
          onPress: () => Linking.openURL("tel:911"),
        },
      ]
    );
  };

  const callDoctor = async () => {
    if (!profile?.emergency_contact) {
      Alert.alert(
        "No Contact Set",
        "Add an emergency contact in your Profile settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Profile", onPress: () => { router.back(); router.push("/(tabs)/profile"); } },
        ]
      );
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${profile.emergency_contact}`);
  };

  return (
    <LinearGradient colors={["#1A0505", "#0A0E1A", "#0A0E1A"]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        {/* Close button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Alert icon */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.alertSection}>
          <View style={styles.pulseContainer}>
            <Animated.View style={[styles.pulseRing, pulseStyle]} />
            <LinearGradient colors={[Colors.dangerLight, Colors.danger]} style={styles.alertIcon}>
              <Ionicons name="warning" size={40} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.alertTitle}>Emergency Alert</Text>
          {isEmergency && glucoseStatus && (
            <View style={[styles.glucoseBadge, { backgroundColor: glucoseStatus.bgColor }]}>
              <Ionicons name="pulse" size={14} color={glucoseStatus.color} />
              <Text style={[styles.glucoseBadgeText, { color: glucoseStatus.color }]}>
                Glucose: {currentGlucose} mg/dL — {glucoseStatus.label}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Danger info */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Immediate Actions</Text>
            <View style={styles.actionList}>
              {currentGlucose && currentGlucose < 70 ? (
                <>
                  <ActionItem icon="🍬" text="Take 15g fast-acting carbs (glucose tablets, juice, soda)" />
                  <ActionItem icon="⏱️" text="Wait 15 minutes, then re-check glucose" />
                  <ActionItem icon="🔄" text="Repeat if still below 70 mg/dL" />
                  <ActionItem icon="🍎" text="Eat a snack once glucose stabilizes" />
                </>
              ) : currentGlucose && currentGlucose > 250 ? (
                <>
                  <ActionItem icon="💧" text="Drink plenty of water" />
                  <ActionItem icon="💉" text="Check for ketones if possible" />
                  <ActionItem icon="🏥" text="Contact your healthcare team" />
                  <ActionItem icon="🚗" text="Do not drive — seek help immediately" />
                </>
              ) : (
                <>
                  <ActionItem icon="📱" text="Call emergency services if feeling unwell" />
                  <ActionItem icon="💉" text="Tell emergency responders you have diabetes" />
                  <ActionItem icon="🏥" text="If unconscious, do NOT give food or drink" />
                  <ActionItem icon="📋" text="Provide your medication list to responders" />
                </>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.buttons}>
          <TouchableOpacity onPress={callEmergency} style={styles.emergencyCallBtn}>
            <LinearGradient colors={[Colors.dangerLight, Colors.danger]} style={styles.emergencyCallGrad}>
              <Ionicons name="call" size={24} color="#FFF" />
              <Text style={styles.emergencyCallText}>Call 911</Text>
            </LinearGradient>
          </TouchableOpacity>

          {profile?.emergency_contact && (
            <TouchableOpacity onPress={callDoctor} style={styles.doctorBtn}>
              <Ionicons name="person" size={18} color={Colors.mintPrimary} />
              <Text style={styles.doctorBtnText}>Call My Contact</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => router.push("/(tabs)/chat")} style={styles.aiBtn}>
            <Ionicons name="sparkles" size={16} color={Colors.neonGreen} />
            <Text style={styles.aiBtnText}>Ask GlucoAI</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          GlucoAI is not a substitute for professional medical care.{"\n"}
          In life-threatening emergencies, always call 911.
        </Text>
      </View>
    </LinearGradient>
  );
}

function ActionItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.actionItem}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, paddingHorizontal: 24, gap: 20,
  },
  closeBtn: {
    alignSelf: "flex-end",
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  alertSection: { alignItems: "center", gap: 14 },
  pulseContainer: { position: "relative", alignItems: "center", justifyContent: "center", width: 100, height: 100 },
  pulseRing: {
    position: "absolute",
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.danger + "30",
    borderWidth: 2, borderColor: Colors.danger + "50",
  },
  alertIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.danger, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 20, elevation: 15,
  },
  alertTitle: { fontSize: 26, fontFamily: "Inter_800ExtraBold", color: "#FFF" },
  glucoseBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  glucoseBadgeText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  infoCard: {
    backgroundColor: "rgba(20,27,45,0.9)", borderRadius: 20,
    padding: 18, borderWidth: 0.5, borderColor: "rgba(255,68,68,0.2)",
    gap: 14,
  },
  infoTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  actionList: { gap: 10 },
  actionItem: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  actionIcon: { fontSize: 18, width: 26 },
  actionText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  buttons: { gap: 10 },
  emergencyCallBtn: { borderRadius: 16, overflow: "hidden" },
  emergencyCallGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 18,
    shadowColor: Colors.danger, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  emergencyCallText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
  doctorBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.mintPrimary + "40",
    backgroundColor: Colors.mintPrimary + "08",
  },
  doctorBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.mintPrimary },
  aiBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 12, borderRadius: 14,
    backgroundColor: "rgba(0,255,136,0.06)",
    borderWidth: 0.5, borderColor: Colors.neonGreen + "30",
  },
  aiBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.neonGreen },
  disclaimer: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted,
    textAlign: "center", lineHeight: 18,
  },
});
