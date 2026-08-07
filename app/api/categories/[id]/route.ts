import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId, errorResponse, ApiError } from "@/lib/api-helpers";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  icon: z.string().trim().min(1).max(10).optional(),
  color: z.string().trim().min(1).max(20).optional(),
  archived: z.boolean().optional(),
});

async function getOwnedCategory(userId: string, id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category || category.userId !== userId) {
    throw new ApiError(404, "Категория не найдена.");
  }
  return category;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId(request);
    const { id } = await params;
    await getOwnedCategory(userId, id);
    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Проверьте поля категории." }, { status: 400 });
    }
    const category = await prisma.category.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ category });
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
    await getOwnedCategory(userId, id);

    const txCount = await prisma.transaction.count({ where: { categoryId: id } });
    if (txCount > 0) {
      await prisma.category.update({ where: { id }, data: { archived: true } });
      return NextResponse.json({ ok: true, archived: true });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true, archived: false });
  } catch (error) {
    return errorResponse(error);
  }
}
