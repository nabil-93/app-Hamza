import { useEffect } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "@store/authStore";
import { Colors } from "@constants/colors";

export default function Index() {
  const { session, isLoading, isOnboarded } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.mintPrimary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!isOnboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/home" />;
}
