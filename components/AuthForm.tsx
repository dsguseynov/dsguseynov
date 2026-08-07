"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type { AuthUser } from "@/lib/types";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password };
      await api.post<{ user: AuthUser }>(url, body);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-xl shadow-black/5">
      {mode === "register" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted" htmlFor="name">
            Имя
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
            placeholder="Как вас зовут"
            autoComplete="name"
          />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
          placeholder="Минимум 6 символов"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      {error && <p className="text-sm text-expense">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
      </button>
    </form>
  );
}
