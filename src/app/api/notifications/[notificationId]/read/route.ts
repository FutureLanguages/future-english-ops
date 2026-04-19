import { NextResponse } from "next/server";
import { requireAuthenticatedSession } from "@/features/auth/server/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const session = await requireAuthenticatedSession();
  const { notificationId } = await params;

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.id,
    },
    data: {
      isRead: true,
    },
  });

  return NextResponse.json({ ok: true });
}
