import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Plus } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDataChanged } from "@/lib/events";
import { colors, radius } from "@/lib/theme";
import type { Category } from "@/lib/types";

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<"expense" | "income">("expense");

  const load = useCallback(() => {
    api.get<{ categories: Category[] }>("/api/categories").then((r) => setCategories(r.categories));
  }, []);

  useEffect(load, [load]);
  useDataChanged(load);

  const filtered = categories.filter((c) => c.type === tab && !c.archived);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 10 }}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 4 }}>
            <Text style={styles.h1}>Ещё</Text>

            <View style={styles.card}>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>

            <View style={styles.headerRow}>
              <Text style={styles.h2}>Категории</Text>
              <Pressable
                style={styles.addBtn}
                onPress={() => router.push({ pathname: "/category-form", params: { type: tab } })}
              >
                <Plus size={16} color={colors.primaryForeground} />
                <Text style={styles.addBtnText}>Добавить</Text>
              </Pressable>
            </View>

            <View style={styles.segmented}>
              <Pressable
                onPress={() => setTab("expense")}
                style={[styles.segmentBtn, tab === "expense" && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, tab === "expense" && styles.segmentTextActive]}>
                  Расходы
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTab("income")}
                style={[styles.segmentBtn, tab === "income" && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, tab === "income" && styles.segmentTextActive]}>
                  Доходы
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.categoryCard}
            onPress={() =>
              router.push({ pathname: "/category-form", params: { id: item.id, type: item.type } })
            }
          >
            <View style={[styles.iconWrap, { backgroundColor: `${item.color}22` }]}>
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
            </View>
            <Text style={styles.categoryName} numberOfLines={1}>
              {item.name}
            </Text>
          </Pressable>
        )}
        ListFooterComponent={
          <Pressable onPress={logout} style={styles.logoutBtn}>
            <LogOut size={18} color={colors.expense} />
            <Text style={styles.logoutText}>Выйти из аккаунта</Text>
          </Pressable>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  h1: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  h2: { fontSize: 17, fontWeight: "600", color: colors.foreground },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  name: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  email: { fontSize: 13, color: colors.muted, marginTop: 2 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
  segmented: { flexDirection: "row", backgroundColor: colors.border, borderRadius: radius.sm, padding: 4, gap: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 14, fontWeight: "500", color: colors.muted },
  segmentTextActive: { color: colors.primaryForeground },
  categoryCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  categoryName: { fontSize: 13, fontWeight: "500", color: colors.foreground, flexShrink: 1 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 14,
    marginTop: 20,
  },
  logoutText: { color: colors.expense, fontSize: 15, fontWeight: "600" },
});
