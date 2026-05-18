import { Tabs } from "expo-router";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@constants/colors";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
}

function TabIcon({ name, focused, label }: TabIconProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (focused) {
    scale.value = withSequence(withSpring(1.2), withSpring(1));
  }

  return (
    <Animated.View style={[styles.tabItem, style]}>
      {focused && (
        <LinearGradient
          colors={[Colors.mintPrimary + "30", Colors.tealPrimary + "20"]}
          style={styles.activeIndicator}
        />
      )}
      <Ionicons
        name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
        size={22}
        color={focused ? Colors.mintPrimary : Colors.textMuted}
      />
    </Animated.View>
  );
}

function ScanButton() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(withTiming(0.9, { duration: 100 }), withSpring(1));
    router.push("/scanner");
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.scanButtonWrapper}>
      <Animated.View style={style}>
        <LinearGradient
          colors={[Colors.mintLight, Colors.mintPrimary, Colors.tealPrimary]}
          style={styles.scanButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.scanButtonInner}>
            <Ionicons name="scan" size={26} color="#FFF" />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint="dark"
            style={StyleSheet.absoluteFill}
          >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,14,26,0.85)", borderTopWidth: 0.5, borderTopColor: Colors.borderMint }]} />
          </BlurView>
        ),
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bar-chart" focused={focused} label="History" />
          ),
        }}
      />
      <Tabs.Screen
        name="scan-placeholder"
        options={{
          tabBarButton: () => <ScanButton />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbubble-ellipses" focused={focused} label="AI Chat" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  activeIndicator: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
  },
  scanButtonWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Platform.OS === "ios" ? 20 : 10,
  },
  scanButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.mintPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  scanButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
});
