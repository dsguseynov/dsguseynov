"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/api-client";
import { emitDataChanged } from "@/lib/events";
import type { Budget, Category } from "@/lib/types";

export function BudgetModal({
  onClose,
  month,
  year,
  budget,
}: {
  onClose: () => void;
  month: number;
  year: number;
  budget?: Budget;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? "");
  const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ categories: Category[] }>("/api/categories")
      .then((r) => setCategories(r.categories.filter((c) => c.type === "expense" && !c.archived)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      if (budget) {
        await api.patch(`/api/budgets/${budget.id}`, { amount: numericAmount });
      } else {
        await api.post("/api/budgets", { categoryId, amount: numericAmount, month, year });
      }
      emitDataChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!budget) return;
    if (!confirm("Удалить бюджет?")) return;
    setSaving(true);
    try {
      await api.delete(`/api/budgets/${budget.id}`);
      emitDataChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={budget ? "Редактировать бюджет" : "Новый бюджет"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Категория</label>
          {budget ? (
            <p className="rounded-xl border border-border bg-background px-4 py-3">
              {budget.category?.icon} {budget.category?.name}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                    categoryId === c.id ? "border-primary bg-primary/10 font-medium" : "border-border"
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Сумма бюджета в месяц</label>
          <input
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="rounded-xl border border-border bg-background px-4 py-3 text-2xl font-semibold outline-none focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-expense">{error}</p>}

        <div className="mt-2 flex gap-2">
          {budget && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium text-expense transition active:scale-[0.98] disabled:opacity-60"
            >
              Удалить
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
