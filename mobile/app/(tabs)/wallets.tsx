import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { api } from "@/lib/api";
import { useDataChanged } from "@/lib/events";
import { formatMoney } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { Wallet } from "@/lib/types";

export default function WalletsScreen() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ wallets: Wallet[] }>("/api/wallets")
      .then((r) => setWallets(r.wallets))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(load, [load]);
  useDataChanged(load);

  const active = wallets.filter((w) => !w.archived);
  const archived = wallets.filter((w) => w.archived);
  const total = active.reduce((sum, w) => sum + w.balance, 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={[...active, ...archived]}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <View style={styles.headerRow}>
              <Text style={styles.h1}>Кошельки</Text>
              <Pressable style={styles.addBtn} onPress={() => router.push("/wallet-form")}>
                <Plus size={16} color={colors.primaryForeground} />
                <Text style={styles.addBtnText}>Добавить</Text>
              </Pressable>
            </View>
            <Text style={styles.total}>
              Итого:{" "}
              <Text style={styles.totalValue}>
                {formatMoney(total, active[0]?.currency ?? "RUB")}
              </Text>
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/wallet-form", params: { id: item.id } })}
            style={[styles.card, item.archived && { opacity: 0.5 }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${item.color}22` }]}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.currency}>{item.currency}</Text>
            </View>
            <Text style={styles.balance}>{formatMoney(item.balance, item.currency)}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: colors.primaryForeground, fontSize: 13, fontWeight: "600" },
  total: { fontSize: 13, color: colors.muted },
  totalValue: { fontWeight: "700", color: colors.foreground },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  currency: { fontSize: 12, color: colors.muted },
  balance: { fontSize: 17, fontWeight: "700", color: colors.foreground },
});
