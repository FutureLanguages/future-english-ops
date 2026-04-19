import { NextResponse } from "next/server";
import {
  authenticateUser,
  createAuthSessionCookieValue,
  getPostLoginRedirectPath,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/features/auth/server/session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return NextResponse.redirect(new URL("/?error=missing_credentials", request.url));
  }

  const session = await authenticateUser(username, password);

  if (!session) {
    return NextResponse.redirect(new URL("/?error=invalid_credentials", request.url), 303);
  }

  const response = NextResponse.redirect(
    new URL(getPostLoginRedirectPath(session), request.url),
    303,
  );
  response.cookies.set(SESSION_COOKIE_NAME, createAuthSessionCookieValue(session), {
    ...getSessionCookieOptions(),
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
