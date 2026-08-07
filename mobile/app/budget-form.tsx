import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { ModalScreen } from "@/components/ModalScreen";
import { formStyles as s } from "@/components/formStyles";
import { api } from "@/lib/api";
import { emitDataChanged } from "@/lib/events";
import { colors } from "@/lib/theme";
import type { Budget, Category } from "@/lib/types";

export default function BudgetFormScreen() {
  const router = useRouter();
  const { id, month, year } = useLocalSearchParams<{ id?: string; month: string; year: string }>();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await api.get<{ categories: Category[] }>("/api/categories");
      setCategories(c.categories.filter((cat) => cat.type === "expense" && !cat.archived));

      if (id) {
        const b = await api.get<{ budgets: Budget[] }>(`/api/budgets?month=${month}&year=${year}`);
        const found = b.budgets.find((x) => x.id === id);
        if (found) {
          setBudget(found);
          setCategoryId(found.categoryId ?? "");
          setAmount(String(found.amount));
        }
      }
      setLoadingInitial(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit() {
    setError(null);
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (!categoryId) {
      setError("Выберите категорию.");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError("Введите сумму больше нуля.");
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await api.patch(`/api/budgets/${id}`, { amount: numericAmount });
      } else {
        await api.post("/api/budgets", {
          categoryId,
          amount: numericAmount,
          month: Number(month),
          year: Number(year),
        });
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
    setSaving(true);
    api
      .delete(`/api/budgets/${id}`)
      .then(() => {
        emitDataChanged();
        router.back();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка удаления."))
      .finally(() => setSaving(false));
  }

  if (loadingInitial) {
    return (
      <ModalScreen title="Бюджет">
        <ActivityIndicator color={colors.primary} />
      </ModalScreen>
    );
  }

  return (
    <ModalScreen title={id ? "Редактировать бюджет" : "Новый бюджет"}>
      <View style={s.field}>
        <Text style={s.label}>Категория</Text>
        {budget ? (
          <View style={s.input}>
            <Text style={{ fontSize: 16, color: colors.foreground }}>
              {budget.category?.icon} {budget.category?.name}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => (
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
        )}
      </View>

      <View style={s.field}>
        <Text style={s.label}>Сумма бюджета в месяц</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
          style={s.amountInput}
        />
      </View>

      {error && <Text style={s.error}>{error}</Text>}

      <View style={s.buttonRow}>
        {id && (
          <Pressable onPress={handleDelete} disabled={saving} style={s.dangerButton}>
            <Text style={s.dangerButtonText}>Удалить</Text>
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
