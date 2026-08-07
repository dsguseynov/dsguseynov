"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Share } from "lucide-react";
import { api } from "@/lib/api-client";
import { useDataChanged } from "@/lib/events";
import { CategoryModal } from "@/components/CategoryModal";
import type { AuthUser, Category } from "@/lib/types";

export default function MorePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api.get<{ categories: Category[] }>("/api/categories").then((r) => setCategories(r.categories));
  }, []);

  useEffect(load, [load]);
  useDataChanged(load);

  useEffect(() => {
    api.get<{ user: AuthUser }>("/api/auth/me").then((r) => setUser(r.user));
  }, []);

  async function handleLogout() {
    await api.post("/api/auth/logout");
    router.push("/login");
    router.refresh();
  }

  const filtered = categories.filter((c) => c.type === tab && !c.archived);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Ещё</h1>

      <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/5">
        <p className="font-medium">{user?.name}</p>
        <p className="text-sm text-muted">{user?.email}</p>
      </div>

      <div className="rounded-2xl bg-surface p-4 shadow-sm shadow-black/5">
        <div className="mb-2 flex items-start gap-2 text-sm text-muted">
          <Share size={16} className="mt-0.5 shrink-0" />
          <p>
            На iPhone откройте сайт в Safari → «Поделиться» → «На экран «Домой»», чтобы
            пользоваться приложением как обычным. Данные синхронизируются автоматически со всех
            устройств, где вы вошли под своим аккаунтом.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Категории</h2>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus size={16} /> Добавить
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
          <button
            onClick={() => setTab("expense")}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              tab === "expense" ? "bg-primary text-primary-foreground shadow" : "text-muted"
            }`}
          >
            Расходы
          </button>
          <button
            onClick={() => setTab("income")}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              tab === "income" ? "bg-primary text-primary-foreground shadow" : "text-muted"
            }`}
          >
            Доходы
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setEditing(c)}
              className="flex items-center gap-2 rounded-xl bg-surface p-3 text-left shadow-sm shadow-black/5"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                style={{ backgroundColor: `${c.color}22` }}
              >
                {c.icon}
              </span>
              <span className="truncate text-sm font-medium">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-border py-3.5 text-sm font-medium text-expense transition active:scale-[0.98]"
      >
        <LogOut size={18} /> Выйти из аккаунта
      </button>

      {creating && <CategoryModal type={tab} onClose={() => setCreating(false)} />}
      {editing && (
        <CategoryModal type={editing.type} category={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
