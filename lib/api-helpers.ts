import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Returns the authenticated user id, or throws an ApiError(401) that the route's catch block should turn into a response. */
export async function requireUserId() {
  const userId = await getCurrentUserId();
  if (!userId) throw new ApiError(401, "Не авторизован.");
  return userId;
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
}
