import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId(request);
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["expense", "income"]),
  icon: z.string().trim().min(1).max(10).default("🏷️"),
  color: z.string().trim().min(1).max(20).default("#6366f1"),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Проверьте поля категории." }, { status: 400 });
    }
    const category = await prisma.category.create({ data: { ...parsed.data, userId } });
    return NextResponse.json({ category });
  } catch (error) {
    return errorResponse(error);
  }
}
