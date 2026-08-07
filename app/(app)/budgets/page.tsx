"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { useDataChanged } from "@/lib/events";
import { formatMoney, MONTH_NAMES } from "@/lib/format";
import { BudgetModal } from "@/components/BudgetModal";
import type { Budget } from "@/lib/types";

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ budgets: Budget[] }>(`/api/budgets?month=${month}&year=${year}`)
      .then((r) => setBudgets(r.budgets));
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

  const currency = "RUB";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Бюджеты</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => shiftMonth(-1)}
          aria-label="Предыдущий месяц"
          className="rounded-full p-2 transition hover:bg-surface"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="w-40 text-center font-medium">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <button
          onClick={() => shiftMonth(1)}
          aria-label="Следующий месяц"
          className="rounded-full p-2 transition hover:bg-surface"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {budgets.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">
          Пока нет бюджетов на этот месяц. Добавьте лимит по категории, чтобы отслеживать траты.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {budgets.map((b) => {
          const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
          const over = b.spent > b.amount;
          const barColor = over ? "var(--expense)" : pct > 80 ? "#f59e0b" : "var(--primary)";
          return (
            <button
              key={b.id}
              onClick={() => setEditing(b)}
              className="flex flex-col gap-2 rounded-2xl bg-surface p-4 text-left shadow-sm shadow-black/5 transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {b.category?.icon} {b.category?.name}
                </p>
                <p className={`text-sm font-semibold ${over ? "text-expense" : ""}`}>
                  {formatMoney(b.spent, currency)} / {formatMoney(b.amount, currency)}
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {creating && <BudgetModal month={month} year={year} onClose={() => setCreating(false)} />}
      {editing && (
        <BudgetModal month={month} year={year} budget={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
