import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@constants/colors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blur?: number;
  glowColor?: string;
  gradient?: [string, string];
  borderColor?: string;
  padding?: number;
}

export function GlassCard({
  children,
  style,
  blur = 20,
  glowColor,
  gradient,
  borderColor = Colors.bgGlassBorder,
  padding = 16,
}: GlassCardProps) {
  return (
    <View
      style={[
        styles.container,
        glowColor && {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        },
        style,
      ]}
    >
      <BlurView intensity={blur} tint="dark" style={StyleSheet.absoluteFill} />
      {gradient ? (
        <LinearGradient
          colors={gradient}
          style={[StyleSheet.absoluteFill, styles.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(20,27,45,0.75)" }]} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.border, { borderColor }]} />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
  },
  gradient: {
    borderRadius: 20,
  },
  border: {
    borderRadius: 20,
    borderWidth: 0.8,
  },
});
