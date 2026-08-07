import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, errorResponse } from "@/lib/api-helpers";
import { getWalletBalances } from "@/lib/balance";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") ?? "", 10) || now.getMonth() + 1;
    const year = parseInt(searchParams.get("year") ?? "", 10) || now.getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const wallets = await getWalletBalances(userId);
    const totalBalance = wallets
      .filter((w) => !w.archived)
      .reduce((sum, w) => sum + w.balance, 0);

    const monthTransactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { category: true },
    });

    let income = 0;
    let expense = 0;
    const byCategory = new Map<
      string,
      { categoryId: string | null; name: string; icon: string; color: string; total: number }
    >();

    for (const t of monthTransactions) {
      if (t.type === "income") income += t.amount;
      if (t.type === "expense") {
        expense += t.amount;
        const key = t.categoryId ?? "none";
        const entry = byCategory.get(key) ?? {
          categoryId: t.categoryId,
          name: t.category?.name ?? "Без категории",
          icon: t.category?.icon ?? "📦",
          color: t.category?.color ?? "#78716c",
          total: 0,
        };
        entry.total += t.amount;
        byCategory.set(key, entry);
      }
    }

    const categoryBreakdown = [...byCategory.values()].sort((a, b) => b.total - a.total);

    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: {
        category: true,
        wallet: { select: { id: true, name: true, icon: true, currency: true } },
        transferToWallet: { select: { id: true, name: true, icon: true, currency: true } },
      },
    });

    return NextResponse.json({
      totalBalance,
      wallets,
      month,
      year,
      income,
      expense,
      categoryBreakdown,
      recentTransactions,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
