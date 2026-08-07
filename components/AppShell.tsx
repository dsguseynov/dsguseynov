"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, PiggyBank, Wallet, Menu, Plus } from "lucide-react";
import { TransactionModal } from "@/components/TransactionModal";
import type { AuthUser } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/", label: "Обзор", icon: Home },
  { href: "/transactions", label: "Операции", icon: List },
  { href: "/budgets", label: "Бюджеты", icon: PiggyBank },
  { href: "/wallets", label: "Кошельки", icon: Wallet },
  { href: "/more", label: "Ещё", icon: Menu },
] as const;

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="relative mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}

          <button
            onClick={() => setShowAdd(true)}
            aria-label="Добавить операцию"
            className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition active:scale-95"
          >
            <Plus size={26} />
          </button>

          {NAV_ITEMS.slice(2).map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </div>
      </nav>

      {showAdd && (
        <TransactionModal onClose={() => setShowAdd(false)} />
      )}

      <span className="sr-only">{user.name}</span>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function NavLink({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs transition ${
        active ? "text-primary" : "text-muted"
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} />
      {item.label}
    </Link>
  );
}
