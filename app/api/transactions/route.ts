import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId, errorResponse, ApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId(request);
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const walletId = searchParams.get("walletId");
    const categoryId = searchParams.get("categoryId");
    const type = searchParams.get("type");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 500) : 100;

    const where: Record<string, unknown> = { userId };
    if (from || to) {
      where.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (walletId) where.walletId = walletId;
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        category: true,
        wallet: { select: { id: true, name: true, icon: true, currency: true } },
        transferToWallet: { select: { id: true, name: true, icon: true, currency: true } },
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z
  .object({
    walletId: z.string().min(1),
    categoryId: z.string().min(1).optional().nullable(),
    type: z.enum(["expense", "income", "transfer"]),
    amount: z.number().positive(),
    note: z.string().trim().max(500).optional().nullable(),
    date: z.string().min(1),
    transferToWalletId: z.string().min(1).optional().nullable(),
  })
  .refine((data) => data.type !== "transfer" || !!data.transferToWalletId, {
    message: "Укажите кошелёк назначения для перевода.",
    path: ["transferToWalletId"],
  })
  .refine((data) => data.transferToWalletId !== data.walletId, {
    message: "Кошельки перевода должны отличаться.",
    path: ["transferToWalletId"],
  });

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Проверьте поля операции." },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const wallet = await prisma.wallet.findUnique({ where: { id: data.walletId } });
    if (!wallet || wallet.userId !== userId) throw new ApiError(404, "Кошелёк не найден.");

    if (data.type === "transfer") {
      const targetWallet = await prisma.wallet.findUnique({
        where: { id: data.transferToWalletId! },
      });
      if (!targetWallet || targetWallet.userId !== userId) {
        throw new ApiError(404, "Кошелёк назначения не найден.");
      }
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category || category.userId !== userId) {
        throw new ApiError(404, "Категория не найдена.");
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        walletId: data.walletId,
        categoryId: data.type === "transfer" ? null : data.categoryId ?? null,
        type: data.type,
        amount: data.amount,
        note: data.note ?? null,
        date: new Date(data.date),
        transferToWalletId: data.type === "transfer" ? data.transferToWalletId : null,
      },
      include: {
        category: true,
        wallet: { select: { id: true, name: true, icon: true, currency: true } },
        transferToWallet: { select: { id: true, name: true, icon: true, currency: true } },
      },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    return errorResponse(error);
  }
}
