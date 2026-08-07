import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDataChanged } from "@/lib/events";
import { formatMoney, MONTH_NAMES } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { TransactionRow } from "@/components/TransactionRow";
import type { Summary } from "@/lib/types";

export default function DashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api
      .get<Summary>(`/api/summary?month=${month}&year=${year}`)
      .then(setSummary)
      .catch(() => setSummary(null))
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

  const mainCurrency = summary?.wallets[0]?.currency ?? "RUB";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Обзор</Text>
          <Pressable onPress={logout} hitSlop={10}>
            <LogOut color={colors.muted} size={20} />
          </Pressable>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Общий баланс</Text>
          <Text style={styles.balanceValue}>
            {summary ? formatMoney(summary.totalBalance, mainCurrency) : "…"}
          </Text>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceSubLabel}>Доход за месяц</Text>
              <Text style={styles.balanceSubValue}>
                +{summary ? formatMoney(summary.income, mainCurrency) : "…"}
              </Text>
            </View>
            <View>
              <Text style={styles.balanceSubLabel}>Расход за месяц</Text>
              <Text style={styles.balanceSubValue}>
                −{summary ? formatMoney(summary.expense, mainCurrency) : "…"}
              </Text>
            </View>
          </View>
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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Расходы по категориям</Text>
          <CategoryPieChart data={summary?.categoryBreakdown ?? []} />
          {summary && summary.categoryBreakdown.length > 0 && (
            <View style={{ gap: 6 }}>
              {summary.categoryBreakdown.slice(0, 5).map((c) => (
                <View key={c.name} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {c.icon} {c.name}
                  </Text>
                  <Text style={styles.legendValue}>{formatMoney(c.total, mainCurrency)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Последние операции</Text>
          {summary && summary.recentTransactions.length === 0 && (
            <Text style={styles.emptyText}>Пока нет операций</Text>
          )}
          {summary?.recentTransactions.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              onPress={() => router.push({ pathname: "/transaction-form", params: { id: t.id } })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 120, gap: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 20,
  },
  balanceLabel: { color: "#ffffffcc", fontSize: 13 },
  balanceValue: { color: "#fff", fontSize: 30, fontWeight: "700", marginTop: 4 },
  balanceRow: { flexDirection: "row", gap: 28, marginTop: 18 },
  balanceSubLabel: { color: "#ffffffb3", fontSize: 12 },
  balanceSubValue: { color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 2 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  monthLabel: { fontSize: 15, fontWeight: "600", color: colors.foreground, width: 150, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 13, color: colors.foreground },
  legendValue: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: "center", paddingVertical: 12 },
});
