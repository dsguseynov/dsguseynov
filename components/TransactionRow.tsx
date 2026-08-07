"use client";

import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function TransactionRow({
  transaction,
  onClick,
}: {
  transaction: Transaction;
  onClick?: () => void;
}) {
  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";
  const icon = isTransfer ? "🔁" : transaction.category?.icon ?? "📦";
  const color = isTransfer ? "#6366f1" : transaction.category?.color ?? "#78716c";
  const title = isTransfer
    ? `${transaction.wallet.name} → ${transaction.transferToWallet?.name ?? ""}`
    : transaction.category?.name ?? "Без категории";

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition active:bg-background"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: `${color}22` }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted">
          {transaction.wallet.name}
          {transaction.note ? ` · ${transaction.note}` : ""}
        </p>
      </div>
      <p
        className={`shrink-0 text-sm font-semibold ${
          isTransfer ? "text-foreground" : isIncome ? "text-income" : "text-expense"
        }`}
      >
        {isTransfer ? "" : isIncome ? "+" : "−"}
        {formatMoney(transaction.amount, transaction.wallet.currency)}
      </p>
    </button>
  );
}
