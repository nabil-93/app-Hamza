import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
}

export function InputField({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  style,
  onFocus,
  onBlur,
  ...props
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderOpacity = useSharedValue(0);
  const animatedBorder = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    borderOpacity.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    borderOpacity.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error && styles.errorBorder]}>
        {/* Animated glow border */}
        <Animated.View style={[styles.glowBorder, animatedBorder]} />

        <View style={styles.inputRow}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={18}
              color={isFocused ? Colors.mintPrimary : Colors.textMuted}
              style={styles.leftIcon}
            />
          )}
          <TextInput
            {...props}
            style={[styles.input, style]}
            placeholderTextColor={Colors.textMuted}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isPassword && !showPassword}
            selectionColor={Colors.mintPrimary}
          />
          {isPassword ? (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.rightIcon}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          ) : rightIcon ? (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
              <Ionicons name={rightIcon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  container: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(20,27,45,0.8)",
    overflow: "hidden",
  },
  errorBorder: {
    borderColor: Colors.danger + "60",
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.mintPrimary + "80",
    zIndex: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 52,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10, padding: 2 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
  },
  error: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.danger,
    marginLeft: 2,
  },
});
