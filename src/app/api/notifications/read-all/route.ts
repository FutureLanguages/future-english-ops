import { NextResponse } from "next/server";
import { requireAuthenticatedSession } from "@/features/auth/server/session";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  const session = await requireAuthenticatedSession();

  await prisma.notification.updateMany({
    where: {
      userId: session.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return NextResponse.json({ ok: true });
}
