"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { api } from "@/lib/api-client";
import { useDataChanged } from "@/lib/events";
import { formatMoney, MONTH_NAMES } from "@/lib/format";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { TransactionRow } from "@/components/TransactionRow";
import { TransactionModal } from "@/components/TransactionModal";
import type { Summary, Transaction } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const load = useCallback(() => {
    api
      .get<Summary>(`/api/summary?month=${month}&year=${year}`)
      .then(setSummary)
      .catch(() => setSummary(null));
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

  async function handleLogout() {
    await api.post("/api/auth/logout");
    router.push("/login");
    router.refresh();
  }

  const mainCurrency = summary?.wallets[0]?.currency ?? "RUB";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Обзор</h1>
        <button
          onClick={handleLogout}
          aria-label="Выйти"
          className="rounded-full p-2 text-muted transition hover:bg-surface"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="rounded-3xl bg-linear-to-br from-primary to-[#8b7cf6] p-6 text-primary-foreground shadow-lg shadow-primary/30">
        <p className="text-sm opacity-80">Общий баланс</p>
        <p className="mt-1 text-3xl font-bold">
          {summary ? formatMoney(summary.totalBalance, mainCurrency) : "…"}
        </p>
        <div className="mt-5 flex gap-6">
          <div>
            <p className="text-xs opacity-70">Доход за месяц</p>
            <p className="text-lg font-semibold">
              +{summary ? formatMoney(summary.income, mainCurrency) : "…"}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-70">Расход за месяц</p>
            <p className="text-lg font-semibold">
              −{summary ? formatMoney(summary.expense, mainCurrency) : "…"}
            </p>
          </div>
        </div>
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

      <div className="rounded-2xl bg-surface p-5 shadow-sm shadow-black/5">
        <h2 className="mb-2 text-base font-semibold">Расходы по категориям</h2>
        <CategoryPieChart data={summary?.categoryBreakdown ?? []} currency={mainCurrency} />
        {summary && summary.categoryBreakdown.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {summary.categoryBreakdown.slice(0, 5).map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="flex-1 truncate">
                  {c.icon} {c.name}
                </span>
                <span className="font-medium">{formatMoney(c.total, mainCurrency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-surface p-5 shadow-sm shadow-black/5">
        <h2 className="mb-1 text-base font-semibold">Последние операции</h2>
        {summary && summary.recentTransactions.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">Пока нет операций</p>
        )}
        <div className="flex flex-col">
          {summary?.recentTransactions.map((t) => (
            <TransactionRow key={t.id} transaction={t} onClick={() => setEditing(t)} />
          ))}
        </div>
      </div>

      {editing && <TransactionModal transaction={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
