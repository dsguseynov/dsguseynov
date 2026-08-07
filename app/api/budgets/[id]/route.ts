import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId, errorResponse, ApiError } from "@/lib/api-helpers";

async function getOwnedBudget(userId: string, id: string) {
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== userId) throw new ApiError(404, "Бюджет не найден.");
  return budget;
}

const updateSchema = z.object({
  amount: z.number().positive().optional(),
  name: z.string().trim().max(80).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId(request);
    const { id } = await params;
    await getOwnedBudget(userId, id);
    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Проверьте поля бюджета." }, { status: 400 });
    }
    const budget = await prisma.budget.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });
    return NextResponse.json({ budget });
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
    await getOwnedBudget(userId, id);
    await prisma.budget.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
