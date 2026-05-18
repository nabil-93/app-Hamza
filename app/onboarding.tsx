import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlowButton } from "@components/GlowButton";
import { Colors } from "@constants/colors";
import { useAuthStore } from "@store/authStore";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    icon: "pulse" as const,
    gradient: [Colors.mintLight, Colors.mintPrimary] as [string, string],
    title: "Welcome to GlucoAI",
    subtitle: "Your AI-powered companion for intelligent diabetes management",
    description: "Track glucose, analyze meals, and get personalized insights powered by advanced AI.",
    features: ["Smart glucose tracking", "AI-powered analysis", "Personalized insights"],
  },
  {
    id: "2",
    icon: "scan" as const,
    gradient: [Colors.tealLight, Colors.tealPrimary] as [string, string],
    title: "AI Food Scanner",
    subtitle: "Instant nutrition analysis from your camera",
    description: "Simply point your camera at any meal and our AI instantly identifies and analyzes the nutritional content.",
    features: ["Calories & macros", "Glycemic index", "Carb tracking"],
  },
  {
    id: "3",
    icon: "calculator" as const,
    gradient: ["#7C3AED", "#A855F7"] as [string, string],
    title: "Smart Insulin Calc",
    subtitle: "Precision dosing recommendations",
    description: "Get personalized insulin dose suggestions based on your meals, current glucose, and your personal settings.",
    features: ["Carb-based dosing", "Correction bolus", "Safety warnings"],
  },
  {
    id: "4",
    icon: "chatbubble-ellipses" as const,
    gradient: ["#0EA5E9", Colors.neonBlue] as [string, string],
    title: "AI Chat Assistant",
    subtitle: "24/7 diabetes expert in your pocket",
    description: "Ask questions, get advice, and understand your health data with our intelligent AI health assistant.",
    features: ["Medical Q&A", "Diet guidance", "Pattern analysis"],
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setOnboarded } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = e.nativeEvent.contentOffset.x;
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setOnboarded(true);
    router.replace("/(tabs)/home");
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <LinearGradient colors={[Colors.bgPrimary, "#0D1424"]} style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <OnboardingSlide item={item} index={index} scrollX={scrollX} />
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <DotIndicator key={i} index={i} currentIndex={currentIndex} scrollX={scrollX} />
          ))}
        </View>

        <View style={styles.buttons}>
          {!isLast && (
            <TouchableOpacity onPress={handleComplete} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <GlowButton
            title={isLast ? "Get Started" : "Next"}
            onPress={handleNext}
            size="lg"
            fullWidth={isLast}
            style={isLast ? {} : { flex: 1 }}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

function OnboardingSlide({ item, index, scrollX }: {
  item: typeof slides[0];
  index: number;
  scrollX: Animated.SharedValue<number>;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollX.value, inputRange, [40, 0, -40], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View style={{ width, paddingHorizontal: 28 }}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        {/* Icon */}
        <LinearGradient colors={item.gradient} style={styles.iconContainer}>
          <Ionicons name={item.icon} size={48} color="#FFF" />
        </LinearGradient>

        {/* Text */}
        <View style={styles.textSection}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
        </View>

        {/* Features */}
        <View style={styles.featureList}>
          {item.features.map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: item.gradient[0] }]} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function DotIndicator({ index, currentIndex, scrollX }: {
  index: number;
  currentIndex: number;
  scrollX: Animated.SharedValue<number>;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const animatedStyle = useAnimatedStyle(() => {
    const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);
    return { width: dotWidth, opacity };
  });

  return (
    <Animated.View style={[styles.dot, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingTop: 80,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.mintPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 15,
  },
  textSection: { alignItems: "center", gap: 10 },
  slideTitle: {
    fontSize: 28,
    fontFamily: "Inter_800ExtraBold",
    color: "#FFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.mintPrimary,
    textAlign: "center",
  },
  slideDescription: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  featureList: { gap: 10, alignSelf: "stretch" },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureDot: { width: 8, height: 8, borderRadius: 4 },
  featureText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.textPrimary },
  footer: { paddingHorizontal: 28, gap: 20 },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mintPrimary,
  },
  buttons: { flexDirection: "row", alignItems: "center", gap: 12 },
  skipBtn: { paddingVertical: 14, paddingHorizontal: 20 },
  skipText: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
});
