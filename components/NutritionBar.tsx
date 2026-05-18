import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface NutritionBarProps {
  label: string;
  value: number;
  unit?: string;
  maxValue?: number;
  colors: [string, string];
  icon?: string;
}

export function NutritionBar({
  label,
  value,
  unit = "g",
  maxValue = 100,
  colors,
  icon,
}: NutritionBarProps) {
  const width = useSharedValue(0);
  const percentage = Math.min((value / maxValue) * 100, 100);

  useEffect(() => {
    width.value = withTiming(percentage, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {icon} {label}
        </Text>
        <Text style={styles.value}>
          {value}
          <Text style={styles.unit}>{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, barStyle, { overflow: "hidden", borderRadius: 4 }]}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
  },
  value: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  unit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  track: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
});
