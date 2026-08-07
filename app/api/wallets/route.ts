import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId, errorResponse } from "@/lib/api-helpers";
import { getWalletBalances } from "@/lib/balance";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId(request);
    const wallets = await getWalletBalances(userId);
    return NextResponse.json({ wallets });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  currency: z.string().trim().min(1).max(10).default("RUB"),
  icon: z.string().trim().min(1).max(10).default("💳"),
  color: z.string().trim().min(1).max(20).default("#6366f1"),
  startBalance: z.number().finite().default(0),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Проверьте поля кошелька." }, { status: 400 });
    }
    const wallet = await prisma.wallet.create({ data: { ...parsed.data, userId } });
    return NextResponse.json({ wallet: { ...wallet, balance: wallet.startBalance } });
  } catch (error) {
    return errorResponse(error);
  }
}
