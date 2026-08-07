import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Returns the authenticated user id (from the mobile app's Bearer token or the
 * web app's session cookie), or throws an ApiError(401) that the route's catch
 * block should turn into a response. Pass the Request so Bearer tokens work.
 */
export async function requireUserId(request?: Request) {
  const userId = await getUserIdFromRequest(request);
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
