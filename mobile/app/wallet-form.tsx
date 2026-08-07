import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { ModalScreen } from "@/components/ModalScreen";
import { IconColorPicker } from "@/components/IconColorPicker";
import { formStyles as s } from "@/components/formStyles";
import { api } from "@/lib/api";
import { emitDataChanged } from "@/lib/events";
import { colors } from "@/lib/theme";
import type { Wallet } from "@/lib/types";

const WALLET_ICONS = ["💳", "💵", "🏦", "👛", "💰", "🪙", "📱", "🏧", "💼", "🐷"];
const CURRENCIES = ["RUB", "USD", "EUR", "GBP", "KZT", "AMD", "GEL", "TRY"];

export default function WalletFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [loadingInitial, setLoadingInitial] = useState(!!id);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [icon, setIcon] = useState(WALLET_ICONS[0]);
  const [color, setColor] = useState("#6366f1");
  const [startBalance, setStartBalance] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<{ wallets: Wallet[] }>("/api/wallets").then((r) => {
      const w = r.wallets.find((x) => x.id === id);
      if (w) {
        setWallet(w);
        setName(w.name);
        setCurrency(w.currency);
        setIcon(w.icon);
        setColor(w.color);
        setStartBalance(String(w.startBalance));
      }
      setLoadingInitial(false);
    });
  }, [id]);

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Введите название кошелька.");
      return;
    }
    const balanceNum = parseFloat(startBalance.replace(",", ".")) || 0;
    setSaving(true);
    try {
      const payload = { name: name.trim(), currency, icon, color, startBalance: balanceNum };
      if (id) {
        await api.patch(`/api/wallets/${id}`, payload);
      } else {
        await api.post("/api/wallets", payload);
      }
      emitDataChanged();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveToggle() {
    if (!id || !wallet) return;
    setSaving(true);
    try {
      await api.patch(`/api/wallets/${id}`, { archived: !wallet.archived });
      emitDataChanged();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingInitial) {
    return (
      <ModalScreen title="Кошелёк">
        <ActivityIndicator color={colors.primary} />
      </ModalScreen>
    );
  }

  return (
    <ModalScreen title={id ? "Редактировать кошелёк" : "Новый кошелёк"}>
      <View style={s.field}>
        <Text style={s.label}>Название</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Например, Основная карта"
          style={s.input}
        />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Валюта</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCurrency(c)}
              style={[s.chip, currency === c && s.chipActive]}
            >
              <Text style={[s.chipText, currency === c && s.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={s.field}>
        <Text style={s.label}>{id ? "Начальный баланс" : "Стартовый баланс"}</Text>
        <TextInput
          value={startBalance}
          onChangeText={setStartBalance}
          keyboardType="decimal-pad"
          style={s.input}
        />
      </View>

      <IconColorPicker
        icon={icon}
        color={color}
        icons={WALLET_ICONS}
        onIconChange={setIcon}
        onColorChange={setColor}
      />

      {error && <Text style={s.error}>{error}</Text>}

      <View style={s.buttonRow}>
        {wallet && (
          <Pressable onPress={handleArchiveToggle} disabled={saving} style={s.dangerButton}>
            <Text style={s.dangerButtonText}>{wallet.archived ? "Восстановить" : "Архивировать"}</Text>
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
