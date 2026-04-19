import { NextResponse } from "next/server";
import { getPortalDevUser } from "@/features/auth/server/portal-session";
import {
  createAuthSessionCookieValue,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/features/auth/server/session";

export async function GET(request: Request) {
  const redirectUrl = new URL(request.url);
  const returnTo = redirectUrl.searchParams.get("returnTo") || "/portal/dashboard";

  if (process.env.NODE_ENV === "production") {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  const userId = redirectUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  const user = await getPortalDevUser(userId);
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);

  if (!user) {
    return response;
  }

  response.cookies.set(SESSION_COOKIE_NAME, createAuthSessionCookieValue(user), {
    ...getSessionCookieOptions(),
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
