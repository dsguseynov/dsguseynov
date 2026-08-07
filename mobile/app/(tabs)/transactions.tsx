import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useDataChanged } from "@/lib/events";
import { formatDate, formatMoney } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import { TransactionRow } from "@/components/TransactionRow";
import type { Transaction, Wallet } from "@/lib/types";

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Все типы" },
  { value: "expense", label: "Расходы" },
  { value: "income", label: "Доходы" },
  { value: "transfer", label: "Переводы" },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletFilter, setWalletFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: "300" });
    if (walletFilter) params.set("walletId", walletFilter);
    if (typeFilter) params.set("type", typeFilter);
    api
      .get<{ transactions: Transaction[] }>(`/api/transactions?${params}`)
      .then((r) => setTransactions(r.transactions))
      .finally(() => setRefreshing(false));
  }, [walletFilter, typeFilter]);

  useEffect(load, [load]);
  useDataChanged(load);

  useEffect(() => {
    api.get<{ wallets: Wallet[] }>("/api/wallets").then((r) => setWallets(r.wallets));
  }, []);

  const sections = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const key = formatDate(t.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return [...map.entries()];
  }, [transactions]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Операции</Text>
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: "", icon: "", name: "Все кошельки" }, ...wallets]}
          keyExtractor={(w) => w.id}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setWalletFilter(item.id)}
              style={[styles.chip, walletFilter === item.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, walletFilter === item.id && styles.chipTextActive]}>
                {item.icon ? `${item.icon} ${item.name}` : item.name}
              </Text>
            </Pressable>
          )}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TYPE_FILTERS}
          keyExtractor={(t) => t.value}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, marginTop: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setTypeFilter(item.value)}
              style={[styles.chip, typeFilter === item.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, typeFilter === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={sections}
        keyExtractor={([day]) => day}
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
        ListEmptyComponent={<Text style={styles.emptyText}>Операций не найдено</Text>}
        renderItem={({ item: [day, items] }) => {
          const dayTotal = items.reduce(
            (sum, t) => sum + (t.type === "income" ? t.amount : t.type === "expense" ? -t.amount : 0),
            0
          );
          return (
            <View style={styles.card}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{day}</Text>
                {dayTotal !== 0 && (
                  <Text style={[styles.dayTotal, { color: dayTotal > 0 ? colors.income : colors.expense }]}>
                    {dayTotal > 0 ? "+" : ""}
                    {formatMoney(dayTotal, items[0].wallet.currency)}
                  </Text>
                )}
              </View>
              {items.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  onPress={() => router.push({ pathname: "/transaction-form", params: { id: t.id } })}
                />
              ))}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  h1: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  filters: { paddingVertical: 12 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.foreground },
  chipTextActive: { color: colors.primaryForeground, fontWeight: "600" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4, paddingHorizontal: 2 },
  dayLabel: { fontSize: 13, color: colors.muted, fontWeight: "500" },
  dayTotal: { fontSize: 13, fontWeight: "600" },
  emptyText: { textAlign: "center", color: colors.muted, paddingVertical: 40 },
});
