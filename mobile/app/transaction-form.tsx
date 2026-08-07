import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Trash2 } from "lucide-react-native";
import { ModalScreen } from "@/components/ModalScreen";
import { formStyles as s } from "@/components/formStyles";
import { api } from "@/lib/api";
import { emitDataChanged } from "@/lib/events";
import { colors } from "@/lib/theme";
import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types";

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Расход",
  income: "Доход",
  transfer: "Перевод",
};

export default function TransactionFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState("");
  const [transferToWalletId, setTransferToWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [w, c] = await Promise.all([
        api.get<{ wallets: Wallet[] }>("/api/wallets"),
        api.get<{ categories: Category[] }>("/api/categories"),
      ]);
      const activeWallets = w.wallets.filter((wallet) => !wallet.archived);
      setWallets(activeWallets);
      setCategories(c.categories.filter((cat) => !cat.archived));

      if (id) {
        const { transaction } = await api.get<{ transaction: Transaction }>(
          `/api/transactions/${id}`
        );
        setType(transaction.type);
        setAmount(String(transaction.amount));
        setWalletId(transaction.walletId);
        setTransferToWalletId(transaction.transferToWalletId ?? "");
        setCategoryId(transaction.categoryId ?? "");
        setDate(new Date(transaction.date));
        setNote(transaction.note ?? "");
      } else if (activeWallets.length > 0) {
        setWalletId(activeWallets[0].id);
      }
      setLoadingInitial(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const visibleCategories = categories.filter((c) => c.type === type);

  async function handleSubmit() {
    setError(null);
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (!numericAmount || numericAmount <= 0) {
      setError("Введите сумму больше нуля.");
      return;
    }
    if (!walletId) {
      setError("Выберите кошелёк.");
      return;
    }
    if (type === "transfer" && (!transferToWalletId || transferToWalletId === walletId)) {
      setError("Выберите другой кошелёк для перевода.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type,
        amount: numericAmount,
        walletId,
        categoryId: type === "transfer" ? null : categoryId || null,
        transferToWalletId: type === "transfer" ? transferToWalletId : null,
        date: date.toISOString(),
        note: note.trim() || null,
      };
      if (id) {
        await api.patch(`/api/transactions/${id}`, payload);
      } else {
        await api.post("/api/transactions", payload);
      }
      emitDataChanged();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!id) return;
    Alert.alert("Удалить операцию?", undefined, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          try {
            await api.delete(`/api/transactions/${id}`);
            emitDataChanged();
            router.back();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка удаления.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  if (loadingInitial) {
    return (
      <ModalScreen title={id ? "Операция" : "Новая операция"}>
        <ActivityIndicator color={colors.primary} />
      </ModalScreen>
    );
  }

  return (
    <ModalScreen title={id ? "Редактировать операцию" : "Новая операция"}>
      <View style={s.segmented}>
        {(Object.keys(TYPE_LABELS) as TransactionType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[s.segmentBtn, type === t && s.segmentBtnActive]}
          >
            <Text style={[s.segmentText, type === t && s.segmentTextActive]}>
              {TYPE_LABELS[t]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={s.field}>
        <Text style={s.label}>Сумма</Text>
        <TextInputAmount value={amount} onChangeText={setAmount} />
      </View>

      <View style={s.field}>
        <Text style={s.label}>{type === "transfer" ? "Откуда" : "Кошелёк"}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {wallets.map((w) => (
            <Pressable
              key={w.id}
              onPress={() => setWalletId(w.id)}
              style={[s.chip, walletId === w.id && s.chipActive]}
            >
              <Text style={[s.chipText, walletId === w.id && s.chipTextActive]}>
                {w.icon} {w.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {type === "transfer" ? (
        <View style={s.field}>
          <Text style={s.label}>Куда</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {wallets
              .filter((w) => w.id !== walletId)
              .map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => setTransferToWalletId(w.id)}
                  style={[s.chip, transferToWalletId === w.id && s.chipActive]}
                >
                  <Text style={[s.chipText, transferToWalletId === w.id && s.chipTextActive]}>
                    {w.icon} {w.name}
                  </Text>
                </Pressable>
              ))}
          </View>
        </View>
      ) : (
        <View style={s.field}>
          <Text style={s.label}>Категория</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {visibleCategories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                style={[s.chip, categoryId === c.id && s.chipActive]}
              >
                <Text style={[s.chipText, categoryId === c.id && s.chipTextActive]}>
                  {c.icon} {c.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={s.field}>
        <Text style={s.label}>Дата</Text>
        <Pressable style={s.input} onPress={() => setShowDatePicker(true)}>
          <Text style={{ fontSize: 16, color: colors.foreground }}>
            {date.toLocaleDateString("ru-RU")}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(_event, selected) => {
              setShowDatePicker(false);
              if (selected) setDate(selected);
            }}
          />
        )}
      </View>

      <View style={s.field}>
        <Text style={s.label}>Заметка</Text>
        <TextInputNote value={note} onChangeText={setNote} />
      </View>

      {error && <Text style={s.error}>{error}</Text>}

      <View style={s.buttonRow}>
        {id && (
          <Pressable onPress={handleDelete} disabled={saving} style={s.secondaryButton}>
            <Trash2 size={20} color={colors.expense} />
          </Pressable>
        )}
        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          style={[s.primaryButton, saving && { opacity: 0.7 }]}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={s.primaryButtonText}>Сохранить</Text>
          )}
        </Pressable>
      </View>
    </ModalScreen>
  );
}

function TextInputAmount({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      placeholder="0"
      style={s.amountInput}
    />
  );
}

function TextInputNote({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Необязательно"
      style={s.input}
    />
  );
}
