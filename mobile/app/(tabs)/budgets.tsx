import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { api } from "@/lib/api";
import { useDataChanged } from "@/lib/events";
import { formatMoney, MONTH_NAMES } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { Budget } from "@/lib/types";

export default function BudgetsScreen() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ budgets: Budget[] }>(`/api/budgets?month=${month}&year=${year}`)
      .then((r) => setBudgets(r.budgets))
      .finally(() => setRefreshing(false));
  }, [month, year]);

  useEffect(load, [load]);
  useDataChanged(load);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    setMonth(m);
    setYear(y);
  }

  const currency = "RUB";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={budgets}
        keyExtractor={(b) => b.id}
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
          <View style={{ gap: 16, marginBottom: 4 }}>
            <View style={styles.headerRow}>
              <Text style={styles.h1}>Бюджеты</Text>
              <Pressable
                style={styles.addBtn}
                onPress={() => router.push({ pathname: "/budget-form", params: { month, year } })}
              >
                <Plus size={16} color={colors.primaryForeground} />
                <Text style={styles.addBtnText}>Добавить</Text>
              </Pressable>
            </View>
            <View style={styles.monthNav}>
              <Pressable onPress={() => shiftMonth(-1)} hitSlop={10}>
                <ChevronLeft color={colors.foreground} size={20} />
              </Pressable>
              <Text style={styles.monthLabel}>
                {MONTH_NAMES[month - 1]} {year}
              </Text>
              <Pressable onPress={() => shiftMonth(1)} hitSlop={10}>
                <ChevronRight color={colors.foreground} size={20} />
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Пока нет бюджетов на этот месяц. Добавьте лимит по категории, чтобы отслеживать траты.
          </Text>
        }
        renderItem={({ item }) => {
          const pct = item.amount > 0 ? Math.min((item.spent / item.amount) * 100, 100) : 0;
          const over = item.spent > item.amount;
          const barColor = over ? colors.expense : pct > 80 ? "#f59e0b" : colors.primary;
          return (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/budget-form", params: { id: item.id, month, year } })
              }
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {item.category?.icon} {item.category?.name}
                </Text>
                <Text style={[styles.cardAmount, over && { color: colors.expense }]}>
                  {formatMoney(item.spent, currency)} / {formatMoney(item.amount, currency)}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
              </View>
            </Pressable>
          );
        }}
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
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  monthLabel: { fontSize: 15, fontWeight: "600", color: colors.foreground, width: 150, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  cardAmount: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  barTrack: { height: 8, borderRadius: 999, backgroundColor: colors.background, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999 },
  emptyText: { textAlign: "center", color: colors.muted, paddingVertical: 40, paddingHorizontal: 20 },
});
