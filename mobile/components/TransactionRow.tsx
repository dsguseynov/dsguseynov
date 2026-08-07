import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMoney } from "@/lib/format";
import { colors } from "@/lib/theme";
import type { Transaction } from "@/lib/types";

export function TransactionRow({
  transaction,
  onPress,
}: {
  transaction: Transaction;
  onPress?: () => void;
}) {
  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";
  const icon = isTransfer ? "🔁" : transaction.category?.icon ?? "📦";
  const color = isTransfer ? "#6366f1" : transaction.category?.color ?? "#78716c";
  const title = isTransfer
    ? `${transaction.wallet.name} → ${transaction.transferToWallet?.name ?? ""}`
    : transaction.category?.name ?? "Без категории";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {transaction.wallet.name}
          {transaction.note ? ` · ${transaction.note}` : ""}
        </Text>
      </View>
      <Text
        style={[
          styles.amount,
          { color: isTransfer ? colors.foreground : isIncome ? colors.income : colors.expense },
        ]}
      >
        {isTransfer ? "" : isIncome ? "+" : "−"}
        {formatMoney(transaction.amount, transaction.wallet.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
  amount: { fontSize: 14, fontWeight: "700" },
});
