import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { analyzeFood } from "@services/openai";
import { useMealStore } from "@store/mealStore";
import { Colors } from "@constants/colors";
import { useAuthStore } from "@store/authStore";

const { width, height } = Dimensions.get("window");
const FRAME_SIZE = width * 0.75;

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const cameraRef = useRef<CameraView>(null);
  const { setPendingScan, setAnalyzing, isAnalyzing } = useMealStore();
  const { profile } = useAuthStore();

  // Animations
  const pulseScale = useSharedValue(1);
  const scanLine = useSharedValue(0);
  const cornerRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Pulsing border
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );
    // Scanning line
    scanLine.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(withTiming(0.8, { duration: 800 }), withTiming(0.3, { duration: 800 })),
      -1,
      true
    );
  }, []);

  const frameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanLine.value, [0, 1], [0, FRAME_SIZE - 4]) }],
    opacity: interpolate(scanLine.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleCapture = async () => {
    if (!cameraRef.current || isAnalyzing) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (!photo?.uri) return;
      await processImage(photo.uri);
    } catch (e) {
      Alert.alert("Capture Error", "Failed to take photo. Please try again.");
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setAnalyzing(true);
    try {
      const nutrition = await analyzeFood(uri);
      const carbRatio = profile?.carb_ratio ?? 15;
      const correctionFactor = profile?.correction_factor ?? 50;
      const targetGlucose = profile?.target_glucose ?? 100;

      setPendingScan({
        imageUri: uri,
        nutrition,
        insulinDose: 0,
      });
      router.push("/scan-result");
    } catch (e: any) {
      Alert.alert("Analysis Failed", e.message ?? "Could not analyze this image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: Colors.bgPrimary }} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionScreen, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionSubtext}>GlucoAI needs camera access to scan food items.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <LinearGradient colors={[Colors.mintPrimary, Colors.tealPrimary]} style={styles.permissionBtnGrad}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
      />

      {/* Dark overlay with cutout effect */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={{ width: FRAME_SIZE, height: FRAME_SIZE }} />
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Scanner frame */}
      <View style={styles.frameContainer} pointerEvents="none">
        <Animated.View style={[styles.frame, frameStyle]}>
          {/* Glow */}
          <Animated.View style={[styles.frameGlow, glowStyle]} />

          {/* Corners */}
          {["tl", "tr", "bl", "br"].map((corner) => (
            <View
              key={corner}
              style={[
                styles.corner,
                corner.includes("t") ? { top: 0 } : { bottom: 0 },
                corner.includes("l") ? { left: 0 } : { right: 0 },
                corner === "tl" && { borderTopLeftRadius: 12 },
                corner === "tr" && { borderTopRightRadius: 12, borderLeftWidth: 0, borderTopWidth: 3, borderRightWidth: 3 },
                corner === "bl" && { borderBottomLeftRadius: 12, borderTopWidth: 0, borderLeftWidth: 3, borderBottomWidth: 3 },
                corner === "br" && { borderBottomRightRadius: 12, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 3, borderBottomWidth: 3 },
              ]}
            />
          ))}

          {/* Scanning line */}
          <Animated.View style={[styles.scanLine, scanLineStyle]}>
            <LinearGradient
              colors={["transparent", Colors.mintPrimary, Colors.mintLight, Colors.mintPrimary, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, height: 2 }}
            />
          </Animated.View>
        </Animated.View>

        {/* Label */}
        <Text style={styles.frameLabel}>
          {isAnalyzing ? "Analyzing with AI..." : "Point at your meal"}
        </Text>
      </View>

      {/* Loading overlay */}
      {isAnalyzing && (
        <View style={styles.analyzingOverlay}>
          <View style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={Colors.mintPrimary} />
            <Text style={styles.analyzingTitle}>AI Analysis in Progress</Text>
            <Text style={styles.analyzingSubtext}>Identifying food and calculating nutrition...</Text>
            <View style={styles.analyzingDots}>
              {[0, 1, 2].map((i) => (
                <AnalyzingDot key={i} delay={i * 200} />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Top controls */}
      <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.controlBtn}>
          <Ionicons name="close" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <LinearGradient colors={[Colors.mintPrimary, Colors.tealPrimary]} style={styles.aiChip}>
            <Ionicons name="sparkles" size={12} color="#FFF" />
            <Text style={styles.aiChipText}>AI Scanner</Text>
          </LinearGradient>
        </View>
        <TouchableOpacity onPress={() => setFlash(flash === "off" ? "on" : "off")} style={styles.controlBtn}>
          <Ionicons name={flash === "on" ? "flash" : "flash-off"} size={20} color={flash === "on" ? Colors.warning : "#FFF"} />
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity onPress={handlePickFromGallery} style={styles.sideBtn}>
          <Ionicons name="images-outline" size={24} color="#FFF" />
          <Text style={styles.sideBtnText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCapture}
          disabled={isAnalyzing}
          style={styles.captureOuter}
        >
          <LinearGradient
            colors={[Colors.mintLight, Colors.mintPrimary, Colors.tealPrimary]}
            style={styles.captureBtn}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="camera" size={30} color="#FFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFacing(facing === "back" ? "front" : "back")}
          style={styles.sideBtn}
        >
          <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
          <Text style={styles.sideBtnText}>Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AnalyzingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.ease }),
        withTiming(0.3, { duration: 400 })
      ),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.mintPrimary, marginHorizontal: 3 }, style]}
    />
  );
}

const OVERLAY_COLOR = "rgba(0,0,0,0.65)";
const styles = StyleSheet.create({
  permissionScreen: {
    flex: 1, backgroundColor: Colors.bgPrimary, alignItems: "center",
    justifyContent: "center", gap: 16, paddingHorizontal: 40,
  },
  permissionTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF", textAlign: "center" },
  permissionSubtext: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center" },
  permissionBtn: { marginTop: 16, borderRadius: 14, overflow: "hidden" },
  permissionBtnGrad: { paddingVertical: 14, paddingHorizontal: 32 },
  permissionBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  overlayTop: { height: (height - FRAME_SIZE) / 2, backgroundColor: OVERLAY_COLOR },
  overlayMiddle: { flexDirection: "row", height: FRAME_SIZE },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR },
  frameContainer: {
    position: "absolute",
    top: (height - FRAME_SIZE) / 2 - 30,
    left: (width - FRAME_SIZE) / 2,
    width: FRAME_SIZE,
    alignItems: "center",
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: "relative",
    overflow: "hidden",
  },
  frameGlow: {
    position: "absolute",
    inset: 0,
    borderWidth: 1,
    borderColor: Colors.mintPrimary,
    borderRadius: 12,
    shadowColor: Colors.mintPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: Colors.mintLight,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 0,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
  },
  frameLabel: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  controlBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  topCenter: { flex: 1, alignItems: "center" },
  aiChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  aiChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
  },
  sideBtn: { alignItems: "center", gap: 6, opacity: 0.9 },
  sideBtnText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)" },
  captureOuter: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
    overflow: "hidden",
  },
  captureBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    shadowColor: Colors.mintPrimary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 20, elevation: 12,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderMint,
    marginHorizontal: 40,
  },
  analyzingTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
  analyzingSubtext: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center" },
  analyzingDots: { flexDirection: "row", marginTop: 8 },
});
