import React from "react";
import { TouchableOpacity, Text, ViewStyle, TextStyle, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors } from "@constants/colors";

interface GlowButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function GlowButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  fullWidth = true,
}: GlowButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (disabled || loading) return;
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, { damping: 10 })
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 13, borderRadius: 12 },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15, borderRadius: 14 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 17, borderRadius: 16 },
  };

  const s = sizeStyles[size];

  if (variant === "primary") {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={disabled || loading}
        style={[animatedStyle, fullWidth && { width: "100%" }, style]}
      >
        <LinearGradient
          colors={disabled ? ["#2D3748", "#1A202C"] : [Colors.mintLight, Colors.mintPrimary, Colors.tealPrimary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal, borderRadius: s.borderRadius },
            !disabled && styles.glowMint,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, { fontSize: s.fontSize }, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  if (variant === "outline") {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={disabled || loading}
        style={[
          animatedStyle,
          styles.outlineButton,
          { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal, borderRadius: s.borderRadius },
          fullWidth && { width: "100%" },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.mintPrimary} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.outlineText, { fontSize: s.fontSize }, textStyle]}>{title}</Text>
          </>
        )}
      </AnimatedTouchable>
    );
  }

  if (variant === "danger") {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={disabled || loading}
        style={[animatedStyle, fullWidth && { width: "100%" }, style]}
      >
        <LinearGradient
          colors={[Colors.dangerLight, Colors.danger]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal, borderRadius: s.borderRadius }]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, { fontSize: s.fontSize }, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={handlePress}
      activeOpacity={0.9}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        styles.ghostButton,
        { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal, borderRadius: s.borderRadius },
        fullWidth && { width: "100%" },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textSecondary} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.ghostText, { fontSize: s.fontSize }, textStyle]}>{title}</Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  glowMint: {
    shadowColor: Colors.mintPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: "#FFF",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.mintPrimary,
    backgroundColor: "rgba(0,212,168,0.05)",
  },
  outlineText: {
    color: Colors.mintPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  ghostText: {
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
});
