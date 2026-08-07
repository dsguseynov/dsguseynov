import { prisma } from "@/lib/db";

/** Computes the current balance of every wallet belonging to a user: startBalance + income - expense +/- transfers. */
export async function getWalletBalances(userId: string) {
  const wallets = await prisma.wallet.findMany({ where: { userId } });

  const balances = new Map<string, number>();
  for (const w of wallets) balances.set(w.id, w.startBalance);

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    select: { walletId: true, transferToWalletId: true, type: true, amount: true },
  });

  for (const t of transactions) {
    if (t.type === "income") {
      balances.set(t.walletId, (balances.get(t.walletId) ?? 0) + t.amount);
    } else if (t.type === "expense") {
      balances.set(t.walletId, (balances.get(t.walletId) ?? 0) - t.amount);
    } else if (t.type === "transfer") {
      balances.set(t.walletId, (balances.get(t.walletId) ?? 0) - t.amount);
      if (t.transferToWalletId) {
        balances.set(
          t.transferToWalletId,
          (balances.get(t.transferToWalletId) ?? 0) + t.amount
        );
      }
    }
  }

  return wallets.map((w) => ({ ...w, balance: balances.get(w.id) ?? w.startBalance }));
}
