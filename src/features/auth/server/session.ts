import { UserRole } from "@prisma/client";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/features/auth/server/passwords";

export const SESSION_COOKIE_NAME = "app_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type AppSessionRole = "ADMIN" | "STUDENT" | "PARENT";

export type AuthSession = {
  id: string;
  role: AppSessionRole;
  mobileNumber: string;
  mustChangePassword: boolean;
};

type SessionPayload = {
  userId: string;
  role: AppSessionRole;
};

function getSessionSecret() {
  return process.env.AUTH_SECRET || "future-english-dev-secret";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function createSessionValue(payload: SessionPayload) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(process.env.AUTH_COOKIE_DOMAIN ? { domain: process.env.AUTH_COOKIE_DOMAIN } : {}),
  };
}

function parseSessionValue(value: string): SessionPayload | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;

    if (
      !parsed.userId ||
      (parsed.role !== UserRole.ADMIN &&
        parsed.role !== UserRole.STUDENT &&
        parsed.role !== UserRole.PARENT)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getRedirectPathForRole(role: AppSessionRole) {
  if (role === UserRole.ADMIN) {
    return "/admin/dashboard";
  }

  return "/portal/dashboard";
}

export function getPostLoginRedirectPath(session: Pick<AuthSession, "role" | "mustChangePassword">) {
  if (session.mustChangePassword) {
    return "/auth/change-password";
  }

  return getRedirectPathForRole(session.role);
}

export async function authenticateUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      mobileNumber: username,
    },
    select: {
      id: true,
      role: true,
      mobileNumber: true,
      passwordHash: true,
      isActive: true,
      mustChangePassword: true,
    },
  });

  if (
    !user ||
    !user.isActive ||
    (user.role !== UserRole.ADMIN &&
      user.role !== UserRole.STUDENT &&
      user.role !== UserRole.PARENT)
  ) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
    mobileNumber: user.mobileNumber,
    mustChangePassword: user.mustChangePassword,
  } satisfies AuthSession;
}

export async function setAuthSessionCookie(session: AuthSession) {
  const cookieStore = await cookies();
  const cookieValue = createAuthSessionCookieValue(session);

  cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
    ...getSessionCookieOptions(),
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearAuthSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}

export function createAuthSessionCookieValue(session: Pick<AuthSession, "id" | "role">) {
  return createSessionValue({
    userId: session.id,
    role: session.role,
  });
}

export async function getOptionalAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  const payload = parseSessionValue(sessionCookie);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
    select: {
      id: true,
      role: true,
      mobileNumber: true,
      isActive: true,
      mustChangePassword: true,
    },
  });

  if (
    !user ||
    !user.isActive ||
    user.role !== payload.role ||
    (user.role !== UserRole.ADMIN &&
      user.role !== UserRole.STUDENT &&
      user.role !== UserRole.PARENT)
  ) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
    mobileNumber: user.mobileNumber,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function requireAuthenticatedSession() {
  const session = await getOptionalAuthSession();

  if (!session) {
    redirect("/");
  }

  return session;
}

export async function requirePortalSession() {
  const session = await requireAuthenticatedSession();

  if (session.mustChangePassword) {
    redirect("/auth/change-password");
  }

  if (session.role !== UserRole.STUDENT && session.role !== UserRole.PARENT) {
    redirect(getRedirectPathForRole(session.role));
  }

  return session as AuthSession & { role: "STUDENT" | "PARENT" };
}

export async function requireAdminSession() {
  const session = await requireAuthenticatedSession();

  if (session.mustChangePassword) {
    redirect("/auth/change-password");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect(getRedirectPathForRole(session.role));
  }

  return session as AuthSession & { role: "ADMIN" };
}
