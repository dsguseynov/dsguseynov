import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId, errorResponse, ApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") ?? "", 10);
    const year = parseInt(searchParams.get("year") ?? "", 10);
    const now = new Date();

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month: Number.isFinite(month) ? month : now.getMonth() + 1,
        year: Number.isFinite(year) ? year : now.getFullYear(),
      },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });

    const spentByCategory = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type: "expense",
        date: {
          gte: new Date(
            Number.isFinite(year) ? year : now.getFullYear(),
            (Number.isFinite(month) ? month : now.getMonth() + 1) - 1,
            1
          ),
          lt: new Date(
            Number.isFinite(year) ? year : now.getFullYear(),
            Number.isFinite(month) ? month : now.getMonth() + 1,
            1
          ),
        },
      },
      _sum: { amount: true },
    });
    const spentMap = new Map(
      spentByCategory.map((s) => [s.categoryId, s._sum.amount ?? 0])
    );

    const result = budgets.map((b) => ({
      ...b,
      spent: b.categoryId ? spentMap.get(b.categoryId) ?? 0 : 0,
    }));

    return NextResponse.json({ budgets: result });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().max(80).optional().default(""),
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Проверьте поля бюджета." }, { status: 400 });
    }
    const data = parsed.data;

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category || category.userId !== userId) throw new ApiError(404, "Категория не найдена.");

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: data.categoryId,
          month: data.month,
          year: data.year,
        },
      },
      update: { amount: data.amount, name: data.name },
      create: { ...data, userId },
      include: { category: true },
    });

    return NextResponse.json({ budget });
  } catch (error) {
    return errorResponse(error);
  }
}
