import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="transaction-form"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="wallet-form"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="category-form"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="budget-form"
            options={{ presentation: "modal", headerShown: false }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
