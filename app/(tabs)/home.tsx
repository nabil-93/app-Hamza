import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@store/authStore";
import { useMealStore } from "@store/mealStore";
import { useGlucoseStore } from "@store/glucoseStore";
import { getMealScans, getGlucoseLogs } from "@services/supabase";
import { getAIInsight } from "@services/openai";
import { GlassCard } from "@components/GlassCard";
import { GlucoseGauge } from "@components/GlucoseGauge";
import { CardSkeleton, MealSkeleton } from "@components/SkeletonLoader";
import { Colors } from "@constants/colors";
import { getGreeting, formatDateTime, formatRelative } from "@utils/format";
import { getGlucoseStatus } from "@utils/insulin";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const { scans, setScans, getTodayCalories, getTodayCarbs, isLoading: mealsLoading, setLoading: setMealsLoading } = useMealStore();
  const { logs, setLogs, currentGlucose, getAverageGlucose } = useGlucoseStore();
  const [refreshing, setRefreshing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [insightLoading, setInsightLoading] = useState(false);

  const glucoseValue = currentGlucose ?? 0;
  const glucoseStatus = glucoseValue > 0 ? getGlucoseStatus(glucoseValue) : null;
  const todayCalories = getTodayCalories();
  const todayCarbs = getTodayCarbs();
  const averageGlucose = getAverageGlucose();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const loadData = async () => {
    if (!user) return;
    setMealsLoading(true);
    try {
      const [mealData, glucoseData] = await Promise.all([
        getMealScans(user.id, 10),
        getGlucoseLogs(user.id, 7),
      ]);
      if (mealData) setScans(mealData as any);
      if (glucoseData) setLogs(glucoseData as any);
    } catch {
      // silent fail
    } finally {
      setMealsLoading(false);
    }
  };

  const loadInsight = async () => {
    setInsightLoading(true);
    try {
      const insight = await getAIInsight({
        averageGlucose: averageGlucose ?? undefined,
        todayCarbs,
        todayCalories,
        recentMeals: scans.slice(0, 3).map((s) => s.food_name),
      });
      setAiInsight(insight);
    } catch {
      setAiInsight("Keep monitoring your glucose levels regularly and maintaining a balanced diet.");
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (scans.length > 0 || logs.length > 0) {
      loadInsight();
    }
  }, [scans.length, logs.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <LinearGradient colors={[Colors.bgPrimary, "#0C1220", Colors.bgPrimary]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.mintPrimary} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push("/emergency")}
              style={[styles.iconBtn, { backgroundColor: "rgba(255,68,68,0.15)" }]}
            >
              <Ionicons name="warning" size={18} color={Colors.danger} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} style={styles.avatar}>
              <LinearGradient colors={[Colors.mintPrimary, Colors.tealPrimary]} style={styles.avatarGrad}>
                <Text style={styles.avatarText}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Glucose card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <GlassCard
            glowColor={glucoseStatus?.isAlert ? Colors.danger : Colors.mintPrimary}
            gradient={["rgba(0,212,168,0.08)", "rgba(8,145,178,0.05)"]}
            borderColor={glucoseStatus?.isAlert ? Colors.danger + "40" : Colors.borderMint}
          >
            <View style={styles.glucoseCard}>
              <View style={styles.glucoseInfo}>
                <Text style={styles.sectionLabel}>Current Glucose</Text>
                {glucoseValue > 0 ? (
                  <>
                    <GlucoseGauge value={glucoseValue} size={150} />
                    {glucoseStatus?.isAlert && (
                      <View style={styles.alertBadge}>
                        <Ionicons name="warning" size={13} color={Colors.danger} />
                        <Text style={styles.alertText}>Alert: Check your levels</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.noGlucose}>
                    <Ionicons name="add-circle-outline" size={40} color={Colors.textMuted} />
                    <Text style={styles.noGlucoseText}>No reading yet</Text>
                    <Text style={styles.noGlucoseSubtext}>Log your first glucose reading</Text>
                  </View>
                )}
              </View>
              <View style={styles.glucoseStats}>
                <StatItem label="Average" value={averageGlucose ? `${averageGlucose}` : "--"} unit="mg/dL" color={Colors.mintPrimary} />
                <View style={styles.statDivider} />
                <StatItem label="Today" value={logs.filter(l => {
                  const d = new Date(l.created_at);
                  d.setHours(0,0,0,0);
                  return d >= new Date(new Date().setHours(0,0,0,0));
                }).length.toString()} unit="readings" color={Colors.tealLight} />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Today's stats */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statsRow}>
          <StatCard icon="flame" label="Calories" value={Math.round(todayCalories).toString()} unit="kcal" gradient={["#7C3AED", "#A855F7"]} delay={0} />
          <StatCard icon="nutrition" label="Carbs" value={Math.round(todayCarbs).toString()} unit="g" gradient={[Colors.tealLight, Colors.tealPrimary]} delay={80} />
          <StatCard icon="water" label="Sugar" value={Math.round(scans.reduce((s, m) => {
            const today = new Date(); today.setHours(0,0,0,0);
            return new Date(m.created_at) >= today ? s + m.sugar : s;
          }, 0)).toString()} unit="g" gradient={[Colors.mintLight, Colors.mintPrimary]} delay={160} />
        </Animated.View>

        {/* AI Insight */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <GlassCard gradient={["rgba(0,255,136,0.06)", "rgba(0,180,255,0.04)"]} borderColor={Colors.neonGreen + "30"}>
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <LinearGradient colors={[Colors.neonGreen, Colors.neonBlue]} style={styles.insightIcon}>
                  <Ionicons name="sparkles" size={14} color="#000" />
                </LinearGradient>
                <Text style={styles.insightTitle}>AI Insight</Text>
                <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>GPT-4o</Text></View>
              </View>
              {insightLoading ? (
                <View style={{ gap: 8 }}>
                  <View style={styles.insightSkeleton} />
                  <View style={[styles.insightSkeleton, { width: "70%" }]} />
                </View>
              ) : (
                <Text style={styles.insightText}>{aiInsight || "Loading your personalized insight..."}</Text>
              )}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Recent meals */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Meals</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <GlassCard>
            {mealsLoading ? (
              <View style={{ gap: 12 }}>
                {[1, 2, 3].map((i) => <MealSkeleton key={i} />)}
              </View>
            ) : scans.length === 0 ? (
              <EmptyMeals />
            ) : (
              <View style={{ gap: 2 }}>
                {scans.slice(0, 5).map((scan, i) => (
                  <MealItem key={scan.id} scan={scan} delay={i * 50} />
                ))}
              </View>
            )}
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

function StatItem({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, unit, gradient, delay }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit: string;
  gradient: [string, string];
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(delay).springify()} style={{ flex: 1 }}>
      <GlassCard padding={14}>
        <View style={styles.statCard}>
          <LinearGradient colors={gradient} style={styles.statCardIcon}>
            <Ionicons name={icon} size={16} color="#FFF" />
          </LinearGradient>
          <Text style={styles.statCardValue}>{value}<Text style={styles.statCardUnit}>{unit}</Text></Text>
          <Text style={styles.statCardLabel}>{label}</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function MealItem({ scan, delay }: { scan: any; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <View style={styles.mealItem}>
        <View style={styles.mealIconWrap}>
          <LinearGradient colors={[Colors.mintPrimary + "30", Colors.tealPrimary + "20"]} style={styles.mealIcon}>
            <Ionicons name="restaurant" size={20} color={Colors.mintPrimary} />
          </LinearGradient>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mealName} numberOfLines={1}>{scan.food_name}</Text>
          <Text style={styles.mealTime}>{formatRelative(scan.created_at)}</Text>
        </View>
        <View style={styles.mealStats}>
          <Text style={styles.mealCal}>{Math.round(scan.calories)} kcal</Text>
          <Text style={styles.mealCarbs}>{Math.round(scan.carbohydrates)}g carbs</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function EmptyMeals() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={40} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No meals scanned yet</Text>
      <Text style={styles.emptySubtext}>Tap the scan button below to analyze your first meal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  name: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFF", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatar: {},
  avatarGrad: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  glucoseCard: { gap: 16 },
  glucoseInfo: { alignItems: "center" },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 },
  alertBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.danger + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  alertText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.danger },
  noGlucose: { alignItems: "center", gap: 8, paddingVertical: 24 },
  noGlucoseText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  noGlucoseSubtext: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  glucoseStats: { flexDirection: "row", justifyContent: "space-around", paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "rgba(255,255,255,0.08)" },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statUnit: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  statDivider: { width: 0.5, backgroundColor: "rgba(255,255,255,0.1)" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { alignItems: "center", gap: 8 },
  statCardIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statCardValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
  statCardUnit: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  statCardLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  insightCard: { gap: 12 },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  insightIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  insightTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF", flex: 1 },
  aiBadge: { backgroundColor: Colors.neonGreen + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  aiBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.neonGreen },
  insightText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 22 },
  insightSkeleton: { height: 12, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 6, width: "100%" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.mintPrimary },
  mealItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  mealIconWrap: {},
  mealIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mealName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  mealTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  mealStats: { alignItems: "flex-end", gap: 2 },
  mealCal: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.mintPrimary },
  mealCarbs: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  emptyState: { alignItems: "center", gap: 10, paddingVertical: 24 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center", maxWidth: 220 },
});
