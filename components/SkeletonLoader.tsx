import React, { useEffect } from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.4, 0.7, 0.4]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: "#1E2A3E",
          overflow: "hidden",
        },
        animatedStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={["#1E2A3E", "#2D3F57", "#1E2A3E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export function CardSkeleton() {
  return (
    <View style={{ backgroundColor: "#141B2D", borderRadius: 20, padding: 16, gap: 12 }}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={32} />
      <Skeleton width="80%" height={12} />
    </View>
  );
}

export function MealSkeleton() {
  return (
    <View style={{ flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 8 }}>
      <Skeleton width={52} height={52} borderRadius={12} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="50%" height={12} />
      </View>
      <Skeleton width={60} height={28} borderRadius={8} />
    </View>
  );
}
