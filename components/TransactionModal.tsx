"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/api-client";
import { emitDataChanged } from "@/lib/events";
import { toDateInputValue } from "@/lib/format";
import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types";
import { Trash2 } from "lucide-react";

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Расход",
  income: "Доход",
  transfer: "Перевод",
};

export function TransactionModal({
  onClose,
  onSaved,
  transaction,
  defaultWalletId,
}: {
  onClose: () => void;
  onSaved?: () => void;
  transaction?: Transaction;
  defaultWalletId?: string;
}) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [walletId, setWalletId] = useState(transaction?.walletId ?? defaultWalletId ?? "");
  const [transferToWalletId, setTransferToWalletId] = useState(
    transaction?.transferToWalletId ?? ""
  );
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [date, setDate] = useState(
    toDateInputValue(transaction?.date ?? new Date())
  );
  const [note, setNote] = useState(transaction?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ wallets: Wallet[] }>("/api/wallets"),
      api.get<{ categories: Category[] }>("/api/categories"),
    ])
      .then(([w, c]) => {
        setWallets(w.wallets.filter((wallet) => !wallet.archived));
        setCategories(c.categories.filter((cat) => !cat.archived));
        if (!walletId && w.wallets.length > 0) setWalletId(w.wallets[0].id);
      })
      .finally(() => setLoadingLists(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleCategories = categories.filter((c) => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        date: new Date(date).toISOString(),
        note: note.trim() || null,
      };
      if (transaction) {
        await api.patch(`/api/transactions/${transaction.id}`, payload);
      } else {
        await api.post("/api/transactions", payload);
      }
      emitDataChanged();
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    if (!confirm("Удалить операцию?")) return;
    setSaving(true);
    try {
      await api.delete(`/api/transactions/${transaction.id}`);
      emitDataChanged();
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={transaction ? "Редактировать операцию" : "Новая операция"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-background p-1">
          {(Object.keys(TYPE_LABELS) as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                type === t
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted"
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Сумма</label>
          <input
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="rounded-xl border border-border bg-background px-4 py-3 text-2xl font-semibold outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">
            {type === "transfer" ? "Откуда" : "Кошелёк"}
          </label>
          <select
            required
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            disabled={loadingLists}
            className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.icon} {w.name}
              </option>
            ))}
          </select>
        </div>

        {type === "transfer" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Куда</label>
            <select
              required
              value={transferToWalletId}
              onChange={(e) => setTransferToWalletId(e.target.value)}
              disabled={loadingLists}
              className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
            >
              <option value="">Выберите кошелёк</option>
              {wallets
                .filter((w) => w.id !== walletId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Категория</label>
            <div className="flex flex-wrap gap-2">
              {visibleCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                    categoryId === c.id
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border"
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Дата</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Заметка</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Необязательно"
            className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-expense">{error}</p>}

        <div className="mt-2 flex gap-2">
          {transaction && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              aria-label="Удалить"
              className="flex items-center justify-center rounded-xl border border-border px-4 py-3.5 text-expense transition active:scale-[0.98] disabled:opacity-60"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            type="submit"
            disabled={saving || loadingLists}
            className="flex-1 rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
