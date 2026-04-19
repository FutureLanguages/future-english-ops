import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requirePortalSession } from "@/features/auth/server/session";
import type { PortalDevUserOption } from "@/types/portal";

type PortalSession = Awaited<ReturnType<typeof requirePortalSession>>;

export type PortalDevSessionState = {
  isDev: boolean;
  currentUser: PortalSession;
  availableUsers: PortalDevUserOption[];
};

export async function getPortalSession(): Promise<PortalSession> {
  return requirePortalSession();
}

export async function getPortalDevSessionState(): Promise<PortalDevSessionState> {
  const currentUser = await getPortalSession();
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev) {
    return {
      isDev: false,
      currentUser,
      availableUsers: [],
    };
  }

  const users = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.STUDENT, UserRole.PARENT] },
      isActive: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      mobileNumber: true,
    },
  });

  return {
    isDev: true,
    currentUser,
    availableUsers: users
      .filter((user) => user.role === UserRole.STUDENT || user.role === UserRole.PARENT)
      .map((user, index) => ({
        id: user.id,
        role: user.role as "STUDENT" | "PARENT",
        mobileNumber: user.mobileNumber,
        label: `${user.role === UserRole.STUDENT ? "طالب" : "ولي أمر"} ${index + 1}`,
      })),
  };
}

export async function getPortalDevUser(userId: string) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      mobileNumber: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || (user.role !== UserRole.STUDENT && user.role !== UserRole.PARENT)) {
    return null;
  }

  return {
    id: user.id,
    role: user.role as "STUDENT" | "PARENT",
    mobileNumber: user.mobileNumber,
  };
}
