"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { useDataChanged } from "@/lib/events";
import { formatDate, formatMoney } from "@/lib/format";
import { TransactionRow } from "@/components/TransactionRow";
import { TransactionModal } from "@/components/TransactionModal";
import type { Transaction, Wallet } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletFilter, setWalletFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: "300" });
    if (walletFilter) params.set("walletId", walletFilter);
    if (typeFilter) params.set("type", typeFilter);
    api
      .get<{ transactions: Transaction[] }>(`/api/transactions?${params}`)
      .then((r) => setTransactions(r.transactions));
  }, [walletFilter, typeFilter]);

  useEffect(load, [load]);
  useDataChanged(load);

  useEffect(() => {
    api.get<{ wallets: Wallet[] }>("/api/wallets").then((r) => setWallets(r.wallets));
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const key = formatDate(t.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return [...map.entries()];
  }, [transactions]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Операции</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <select
          value={walletFilter}
          onChange={(e) => setWalletFilter(e.target.value)}
          className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-sm outline-none"
        >
          <option value="">Все кошельки</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.icon} {w.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-sm outline-none"
        >
          <option value="">Все типы</option>
          <option value="expense">Расходы</option>
          <option value="income">Доходы</option>
          <option value="transfer">Переводы</option>
        </select>
      </div>

      {groups.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">Операций не найдено</p>
      )}

      <div className="flex flex-col gap-4">
        {groups.map(([day, items]) => {
          const dayTotal = items.reduce(
            (sum, t) => sum + (t.type === "income" ? t.amount : t.type === "expense" ? -t.amount : 0),
            0
          );
          return (
            <div key={day} className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/5">
              <div className="mb-1 flex items-center justify-between px-2">
                <p className="text-sm font-medium text-muted">{day}</p>
                {dayTotal !== 0 && (
                  <p className={`text-sm font-medium ${dayTotal > 0 ? "text-income" : "text-expense"}`}>
                    {dayTotal > 0 ? "+" : ""}
                    {formatMoney(dayTotal, items[0].wallet.currency)}
                  </p>
                )}
              </div>
              <div className="flex flex-col divide-y divide-border">
                {items.map((t) => (
                  <TransactionRow key={t.id} transaction={t} onClick={() => setEditing(t)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editing && <TransactionModal transaction={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
