import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId, errorResponse, ApiError } from "@/lib/api-helpers";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  icon: z.string().trim().min(1).max(10).optional(),
  color: z.string().trim().min(1).max(20).optional(),
  startBalance: z.number().finite().optional(),
  archived: z.boolean().optional(),
});

async function getOwnedWallet(userId: string, id: string) {
  const wallet = await prisma.wallet.findUnique({ where: { id } });
  if (!wallet || wallet.userId !== userId) {
    throw new ApiError(404, "Кошелёк не найден.");
  }
  return wallet;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId(request);
    const { id } = await params;
    await getOwnedWallet(userId, id);
    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Проверьте поля кошелька." }, { status: 400 });
    }
    const wallet = await prisma.wallet.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ wallet });
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
    await getOwnedWallet(userId, id);

    const walletCount = await prisma.wallet.count({ where: { userId } });
    if (walletCount <= 1) {
      throw new ApiError(400, "Нельзя удалить единственный кошелёк.");
    }

    const txCount = await prisma.transaction.count({
      where: { OR: [{ walletId: id }, { transferToWalletId: id }] },
    });
    if (txCount > 0) {
      throw new ApiError(
        400,
        "У кошелька есть операции. Сначала удалите их или заархивируйте кошелёк."
      );
    }

    await prisma.wallet.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
