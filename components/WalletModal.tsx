"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { IconColorPicker } from "@/components/IconColorPicker";
import { api } from "@/lib/api-client";
import { emitDataChanged } from "@/lib/events";
import type { Wallet } from "@/lib/types";

const WALLET_ICONS = ["💳", "💵", "🏦", "👛", "💰", "🪙", "📱", "🏧", "💼", "🐷"];
const CURRENCIES = ["RUB", "USD", "EUR", "GBP", "KZT", "AMD", "GEL", "TRY"];

export function WalletModal({
  onClose,
  wallet,
}: {
  onClose: () => void;
  wallet?: Wallet;
}) {
  const [name, setName] = useState(wallet?.name ?? "");
  const [currency, setCurrency] = useState(wallet?.currency ?? "RUB");
  const [icon, setIcon] = useState(wallet?.icon ?? WALLET_ICONS[0]);
  const [color, setColor] = useState(wallet?.color ?? "#6366f1");
  const [startBalance, setStartBalance] = useState(
    wallet ? String(wallet.startBalance) : "0"
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const balanceNum = parseFloat(startBalance.replace(",", ".")) || 0;
    if (!name.trim()) {
      setError("Введите название кошелька.");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), currency, icon, color, startBalance: balanceNum };
      if (wallet) {
        await api.patch(`/api/wallets/${wallet.id}`, payload);
      } else {
        await api.post("/api/wallets", payload);
      }
      emitDataChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!wallet) return;
    setSaving(true);
    try {
      await api.patch(`/api/wallets/${wallet.id}`, { archived: !wallet.archived });
      emitDataChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={wallet ? "Редактировать кошелёк" : "Новый кошелёк"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Название</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Основная карта"
            className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Валюта</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">
            {wallet ? "Начальный баланс" : "Стартовый баланс"}
          </label>
          <input
            inputMode="decimal"
            value={startBalance}
            onChange={(e) => setStartBalance(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
        </div>

        <IconColorPicker
          icon={icon}
          color={color}
          icons={WALLET_ICONS}
          onIconChange={setIcon}
          onColorChange={setColor}
        />

        {error && <p className="text-sm text-expense">{error}</p>}

        <div className="mt-2 flex gap-2">
          {wallet && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={saving}
              className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-60"
            >
              {wallet.archived ? "Восстановить" : "Архивировать"}
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
