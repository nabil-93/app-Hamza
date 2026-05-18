import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMealStore } from "@store/mealStore";
import { useGlucoseStore } from "@store/glucoseStore";
import { useAuthStore } from "@store/authStore";
import { getMealScans, getGlucoseLogs, deleteMealScan } from "@services/supabase";
import { GlassCard } from "@components/GlassCard";
import { Colors } from "@constants/colors";
import { formatDate, formatTime } from "@utils/format";
import { getGlucoseStatus } from "@utils/insulin";

const { width } = Dimensions.get("window");
type Tab = "meals" | "glucose" | "stats";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("meals");
  const [refreshing, setRefreshing] = useState(false);
  const { scans, setScans, removeScan, getTodayCalories, getTodayCarbs } = useMealStore();
  const { logs, setLogs, getAverageGlucose } = useGlucoseStore();
  const { user } = useAuthStore();

  const loadData = async () => {
    if (!user) return;
    try {
      const [meals, glucose] = await Promise.all([
        getMealScans(user.id, 30),
        getGlucoseLogs(user.id, 14),
      ]);
      if (meals) setScans(meals as any);
      if (glucose) setLogs(glucose as any);
    } catch {}
  };

  useEffect(() => { loadData(); }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Group meals by date
  const groupedMeals = scans.reduce((acc: Record<string, typeof scans>, scan) => {
    const key = formatDate(scan.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(scan);
    return acc;
  }, {});

  const avgGlucose = getAverageGlucose();
  const totalCalories7d = scans
    .filter((s) => new Date(s.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((s, m) => s + m.calories, 0);
  const avgCarbs7d = scans.length > 0
    ? Math.round(scans.slice(0, 7).reduce((s, m) => s + m.carbohydrates, 0) / Math.min(7, scans.length))
    : 0;

  return (
    <LinearGradient colors={[Colors.bgPrimary, "#0C1220", Colors.bgPrimary]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>Your health journey</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["meals", "glucose", "stats"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            {activeTab === tab && (
              <LinearGradient colors={[Colors.mintPrimary, Colors.tealPrimary]} style={StyleSheet.absoluteFill} />
            )}
            <Ionicons
              name={tab === "meals" ? "restaurant" : tab === "glucose" ? "pulse" : "stats-chart"}
              size={14}
              color={activeTab === tab ? "#FFF" : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.mintPrimary} />}
      >
        {activeTab === "meals" && (
          <MealsTab groupedMeals={groupedMeals} onDelete={async (id: string) => {
            try { await deleteMealScan(id); removeScan(id); } catch {}
          }} />
        )}
        {activeTab === "glucose" && <GlucoseTab logs={logs} />}
        {activeTab === "stats" && (
          <StatsTab
            avgGlucose={avgGlucose}
            totalCalories={totalCalories7d}
            avgCarbs={avgCarbs7d}
            totalScans={scans.length}
            totalReadings={logs.length}
          />
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function MealsTab({ groupedMeals, onDelete }: {
  groupedMeals: Record<string, any[]>;
  onDelete: (id: string) => void;
}) {
  const keys = Object.keys(groupedMeals);
  if (keys.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="restaurant-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No meals yet</Text>
        <Text style={styles.emptyText}>Scan your first meal to see it here</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 20 }}>
      {keys.map((date, i) => (
        <Animated.View key={date} entering={FadeInDown.delay(i * 50).springify()}>
          <Text style={styles.dateLabel}>{date}</Text>
          <GlassCard>
            <View style={{ gap: 4 }}>
              {groupedMeals[date].map((scan: any, j: number) => (
                <View key={scan.id}>
                  <View style={styles.mealRow}>
                    <View style={styles.mealLeft}>
                      <LinearGradient colors={[Colors.mintPrimary + "30", Colors.tealPrimary + "20"]} style={styles.mealIconBg}>
                        <Ionicons name="restaurant" size={18} color={Colors.mintPrimary} />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mealName} numberOfLines={1}>{scan.food_name}</Text>
                        <Text style={styles.mealTime}>{formatTime(scan.created_at)}</Text>
                      </View>
                    </View>
                    <View style={styles.mealRight}>
                      <Text style={styles.mealCal}>{Math.round(scan.calories)} kcal</Text>
                      <Text style={styles.mealCarbs}>{Math.round(scan.carbohydrates)}g carbs</Text>
                      {scan.insulin_dose > 0 && (
                        <Text style={styles.mealInsulin}>{scan.insulin_dose}U insulin</Text>
                      )}
                    </View>
                  </View>
                  {j < groupedMeals[date].length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      ))}
    </View>
  );
}

function GlucoseTab({ logs }: { logs: any[] }) {
  if (logs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="pulse-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No glucose logs yet</Text>
        <Text style={styles.emptyText}>Log your glucose readings to track patterns</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 20 }}>
      {/* Mini chart (bar visualization) */}
      <GlassCard gradient={["rgba(0,212,168,0.06)", "rgba(8,145,178,0.04)"]} borderColor={Colors.borderMint}>
        <Text style={styles.cardTitle}>7-Day Overview</Text>
        <View style={styles.miniChart}>
          {logs.slice(-14).map((log, i) => {
            const status = getGlucoseStatus(log.value);
            const height = Math.min(Math.max((log.value / 300) * 80, 8), 80);
            return (
              <View key={log.id} style={styles.barWrapper}>
                <View style={[styles.bar, { height, backgroundColor: status.color + "80" }]} />
                <Text style={styles.barLabel}>{log.value}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <LegendDot color={Colors.success} label="Normal (70-140)" />
          <LegendDot color={Colors.warning} label="Elevated" />
          <LegendDot color={Colors.danger} label="Low/High" />
        </View>
      </GlassCard>

      {/* Log list */}
      <GlassCard>
        <Text style={styles.cardTitle}>All Readings</Text>
        <View style={{ gap: 4 }}>
          {logs.slice().reverse().slice(0, 20).map((log: any, i: number) => {
            const status = getGlucoseStatus(log.value);
            return (
              <View key={log.id}>
                <View style={styles.glucoseRow}>
                  <View style={[styles.glucoseDot, { backgroundColor: status.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.glucoseDate}>{formatDate(log.created_at)} · {formatTime(log.created_at)}</Text>
                    {log.notes && <Text style={styles.glucoseNotes}>{log.notes}</Text>}
                  </View>
                  <View style={[styles.glucoseBadge, { backgroundColor: status.bgColor }]}>
                    <Text style={[styles.glucoseValue, { color: status.color }]}>{log.value}</Text>
                    <Text style={[styles.glucoseUnit, { color: status.color }]}>mg/dL</Text>
                  </View>
                </View>
                {i < Math.min(19, logs.length - 1) && <View style={styles.separator} />}
              </View>
            );
          })}
        </View>
      </GlassCard>
    </View>
  );
}

function StatsTab({ avgGlucose, totalCalories, avgCarbs, totalScans, totalReadings }: {
  avgGlucose: number | null;
  totalCalories: number;
  avgCarbs: number;
  totalScans: number;
  totalReadings: number;
}) {
  const stats = [
    { label: "Avg Glucose", value: avgGlucose ? `${avgGlucose}` : "--", unit: "mg/dL", icon: "pulse", color: Colors.mintPrimary, gradient: [Colors.mintLight, Colors.mintPrimary] as [string, string] },
    { label: "Calories (7d)", value: Math.round(totalCalories / 7).toString(), unit: "kcal/day", icon: "flame", color: "#A855F7", gradient: ["#7C3AED", "#A855F7"] as [string, string] },
    { label: "Avg Carbs", value: `${avgCarbs}`, unit: "g/meal", icon: "nutrition", color: Colors.tealLight, gradient: [Colors.tealLight, Colors.tealPrimary] as [string, string] },
    { label: "Meals Logged", value: `${totalScans}`, unit: "total", icon: "restaurant", color: Colors.warning, gradient: [Colors.warningLight, Colors.warning] as [string, string] },
    { label: "Glucose Logs", value: `${totalReadings}`, unit: "total", icon: "analytics", color: Colors.neonBlue, gradient: [Colors.tealLight, Colors.neonBlue] as [string, string] },
  ];

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.statsGrid}>
        {stats.map((s, i) => (
          <Animated.View key={s.label} entering={FadeInDown.delay(i * 60).springify()} style={styles.statGridItem}>
            <GlassCard padding={16} glowColor={s.color + "40"}>
              <View style={styles.statGridContent}>
                <LinearGradient colors={s.gradient} style={styles.statGridIcon}>
                  <Ionicons name={s.icon as any} size={18} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.statGridValue, { color: s.color }]}>
                  {s.value}
                  <Text style={styles.statGridUnit}> {s.unit}</Text>
                </Text>
                <Text style={styles.statGridLabel}>{s.label}</Text>
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </View>

      {/* AI Summary */}
      <GlassCard gradient={["rgba(0,255,136,0.05)", "rgba(0,180,255,0.04)"]} borderColor={Colors.neonGreen + "20"}>
        <View style={styles.aiSummary}>
          <LinearGradient colors={["#00FF88", "#00B4FF"]} style={styles.aiSummaryIcon}>
            <Ionicons name="sparkles" size={14} color="#000" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiSummaryTitle}>AI Health Summary</Text>
            <Text style={styles.aiSummaryText}>
              {avgGlucose
                ? avgGlucose >= 70 && avgGlucose <= 140
                  ? `Your average glucose (${avgGlucose} mg/dL) is in the healthy range. Keep up the great work maintaining your levels!`
                  : `Your average glucose (${avgGlucose} mg/dL) could be improved. Consider reviewing your meal choices and activity levels.`
                : "Log your glucose readings to get personalized AI insights about your health trends."}
            </Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textMuted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#FFF" },
  headerSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  tabActive: { borderColor: "transparent" },
  tabText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  tabTextActive: { color: "#FFF", fontFamily: "Inter_600SemiBold" },
  container: { paddingHorizontal: 20, gap: 0 },
  dateLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, marginBottom: 8 },
  mealRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  mealLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  mealIconBg: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  mealName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  mealTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  mealRight: { alignItems: "flex-end", gap: 2 },
  mealCal: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.mintPrimary },
  mealCarbs: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  mealInsulin: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#A855F7" },
  separator: { height: 0.5, backgroundColor: "rgba(255,255,255,0.06)", marginLeft: 52 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF", marginBottom: 14 },
  miniChart: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 100, marginBottom: 12 },
  barWrapper: { flex: 1, alignItems: "center", gap: 4, justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 3 },
  barLabel: { fontSize: 8, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  glucoseRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  glucoseDot: { width: 10, height: 10, borderRadius: 5 },
  glucoseDate: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textPrimary },
  glucoseNotes: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  glucoseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignItems: "center" },
  glucoseValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  glucoseUnit: { fontSize: 10, fontFamily: "Inter_400Regular" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statGridItem: { width: (width - 50) / 2 },
  statGridContent: { alignItems: "center", gap: 8 },
  statGridIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statGridValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statGridUnit: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  statGridLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  aiSummary: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  aiSummaryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 2 },
  aiSummaryTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF", marginBottom: 6 },
  aiSummaryText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center" },
});
