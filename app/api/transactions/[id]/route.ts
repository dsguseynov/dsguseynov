import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId, errorResponse, ApiError } from "@/lib/api-helpers";

const updateSchema = z.object({
  walletId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional().nullable(),
  type: z.enum(["expense", "income", "transfer"]).optional(),
  amount: z.number().positive().optional(),
  note: z.string().trim().max(500).optional().nullable(),
  date: z.string().min(1).optional(),
  transferToWalletId: z.string().min(1).optional().nullable(),
});

async function getOwnedTransaction(userId: string, id: string) {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.userId !== userId) {
    throw new ApiError(404, "Операция не найдена.");
  }
  return transaction;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId(request);
    const { id } = await params;
    const existing = await getOwnedTransaction(userId, id);

    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Проверьте поля операции." }, { status: 400 });
    }
    const data = parsed.data;

    if (data.walletId) {
      const wallet = await prisma.wallet.findUnique({ where: { id: data.walletId } });
      if (!wallet || wallet.userId !== userId) throw new ApiError(404, "Кошелёк не найден.");
    }

    const nextType = data.type ?? existing.type;
    if (nextType === "transfer") {
      const targetId = data.transferToWalletId ?? existing.transferToWalletId;
      if (!targetId) throw new ApiError(400, "Укажите кошелёк назначения для перевода.");
      const targetWallet = await prisma.wallet.findUnique({ where: { id: targetId } });
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

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(data.walletId ? { walletId: data.walletId } : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
        ...(data.date ? { date: new Date(data.date) } : {}),
        categoryId: nextType === "transfer" ? null : data.categoryId ?? existing.categoryId,
        transferToWalletId:
          nextType === "transfer"
            ? data.transferToWalletId ?? existing.transferToWalletId
            : null,
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId(request);
    const { id } = await params;
    await getOwnedTransaction(userId, id);
    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
