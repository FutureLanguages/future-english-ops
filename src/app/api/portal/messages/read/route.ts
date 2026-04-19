import { MessageThreadType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPortalSession } from "@/features/auth/server/portal-session";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const user = await getPortalSession();
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

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      studentUserId: true,
      parentUserId: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  if (
    (user.role === UserRole.STUDENT && application.studentUserId !== user.id) ||
    (user.role === UserRole.PARENT && application.parentUserId !== user.id)
  ) {
    return NextResponse.json({ error: "not_allowed" }, { status: 403 });
  }

  const now = new Date();
  await prisma.application.update({
    where: { id: applicationId },
    data:
      user.role === UserRole.STUDENT
        ? {
            studentLastViewedNotesAt: now,
            studentLastViewedStudentThreadAt: now,
          }
        : threadType === MessageThreadType.PARENT
          ? {
              parentLastViewedNotesAt: now,
              parentLastViewedParentThreadAt: now,
            }
          : {
              parentLastViewedNotesAt: now,
              parentLastViewedStudentThreadAt: now,
            },
  });

  return NextResponse.json({ ok: true });
}
