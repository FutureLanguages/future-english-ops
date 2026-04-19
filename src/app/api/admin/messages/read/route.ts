import { MessageThreadType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  await getAdminSession();
  const body = (await request.json()) as {
    applicationId?: string;
    threadType?: string;
  };

  const applicationId = body.applicationId?.trim() ?? "";
  const threadType =
    body.threadType === MessageThreadType.PARENT ? MessageThreadType.PARENT : MessageThreadType.STUDENT;

  if (!applicationId) {
    return NextResponse.json({ error: "application_not_found" }, { status: 400 });
  }

  const now = new Date();
  await prisma.application.update({
    where: { id: applicationId },
    data:
      threadType === MessageThreadType.PARENT
        ? {
            adminLastViewedNotesAt: now,
            adminLastViewedParentThreadAt: now,
          }
        : {
            adminLastViewedNotesAt: now,
            adminLastViewedStudentThreadAt: now,
          },
  });

  return NextResponse.json({ ok: true });
}
