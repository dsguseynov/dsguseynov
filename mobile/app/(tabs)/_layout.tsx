import { Redirect, Tabs, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Home, List, PiggyBank, Wallet, Menu, Plus } from "lucide-react-native";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 },
          tabBarLabelStyle: { fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Обзор", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Операции",
            tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: "Бюджеты",
            tabBarIcon: ({ color, size }) => <PiggyBank color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="wallets"
          options={{
            title: "Кошельки",
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{ title: "Ещё", tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }}
        />
      </Tabs>

      <Pressable
        onPress={() => router.push("/transaction-form")}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <Plus color={colors.primaryForeground} size={26} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  fab: {
    position: "absolute",
    alignSelf: "center",
    bottom: 34,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
