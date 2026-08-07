"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { useDataChanged } from "@/lib/events";
import { formatMoney } from "@/lib/format";
import { WalletModal } from "@/components/WalletModal";
import type { Wallet } from "@/lib/types";

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api.get<{ wallets: Wallet[] }>("/api/wallets").then((r) => setWallets(r.wallets));
  }, []);

  useEffect(load, [load]);
  useDataChanged(load);

  const active = wallets.filter((w) => !w.archived);
  const archived = wallets.filter((w) => w.archived);
  const total = active.reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Кошельки</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} /> Добавить
        </button>
      </div>

      <p className="text-sm text-muted">
        Итого: <span className="font-semibold text-foreground">{formatMoney(total, active[0]?.currency ?? "RUB")}</span>
      </p>

      <div className="flex flex-col gap-3">
        {active.map((w) => (
          <WalletCard key={w.id} wallet={w} onClick={() => setEditing(w)} />
        ))}
      </div>

      {archived.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted">Архив</p>
          {archived.map((w) => (
            <WalletCard key={w.id} wallet={w} onClick={() => setEditing(w)} />
          ))}
        </div>
      )}

      {creating && <WalletModal onClose={() => setCreating(false)} />}
      {editing && <WalletModal wallet={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function WalletCard({ wallet, onClick }: { wallet: Wallet; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl bg-surface p-4 text-left shadow-sm shadow-black/5 transition active:scale-[0.99] ${
        wallet.archived ? "opacity-50" : ""
      }`}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
        style={{ backgroundColor: `${wallet.color}22` }}
      >
        {wallet.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{wallet.name}</p>
        <p className="text-xs text-muted">{wallet.currency}</p>
      </div>
      <p className="shrink-0 text-lg font-semibold">
        {formatMoney(wallet.balance, wallet.currency)}
      </p>
    </button>
  );
}
