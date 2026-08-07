import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { ModalScreen } from "@/components/ModalScreen";
import { IconColorPicker } from "@/components/IconColorPicker";
import { formStyles as s } from "@/components/formStyles";
import { api } from "@/lib/api";
import { emitDataChanged } from "@/lib/events";
import { colors } from "@/lib/theme";
import type { Category } from "@/lib/types";

const CATEGORY_ICONS = [
  "🏷️",
  "🛒",
  "🍽️",
  "🚗",
  "🏠",
  "💡",
  "🛍️",
  "🎬",
  "📱",
  "💊",
  "🏋️",
  "📚",
  "✈️",
  "👨‍👩‍👧",
  "🎁",
  "🛡️",
  "💼",
  "💻",
  "📈",
  "💰",
  "📦",
];

export default function CategoryFormScreen() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id?: string; type: "expense" | "income" }>();

  const [loadingInitial, setLoadingInitial] = useState(!!id);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);
  const [color, setColor] = useState("#6366f1");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<{ categories: Category[] }>("/api/categories").then((r) => {
      const c = r.categories.find((x) => x.id === id);
      if (c) {
        setName(c.name);
        setIcon(c.icon);
        setColor(c.color);
      }
      setLoadingInitial(false);
    });
  }, [id]);

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Введите название категории.");
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await api.patch(`/api/categories/${id}`, { name: name.trim(), icon, color });
      } else {
        await api.post("/api/categories", { name: name.trim(), icon, color, type });
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
      .delete(`/api/categories/${id}`)
      .then(() => {
        emitDataChanged();
        router.back();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка удаления."))
      .finally(() => setSaving(false));
  }

  if (loadingInitial) {
    return (
      <ModalScreen title="Категория">
        <ActivityIndicator color={colors.primary} />
      </ModalScreen>
    );
  }

  return (
    <ModalScreen title={id ? "Редактировать категорию" : "Новая категория"}>
      <View style={s.field}>
        <Text style={s.label}>Название</Text>
        <TextInput value={name} onChangeText={setName} style={s.input} />
      </View>

      <IconColorPicker
        icon={icon}
        color={color}
        icons={CATEGORY_ICONS}
        onIconChange={setIcon}
        onColorChange={setColor}
      />

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
