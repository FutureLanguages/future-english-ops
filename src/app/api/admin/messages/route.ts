import { ApplicationNoteType, MessageThreadType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { formatThreadMessages } from "@/features/messages/server/thread";
import { notifyMessageSent } from "@/features/notifications/server/notifications";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const admin = await getAdminSession();
  const body = (await request.json()) as {
    applicationId?: string;
    threadType?: string;
    message?: string;
  };

  const applicationId = body.applicationId?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const threadType =
    body.threadType === MessageThreadType.PARENT ? MessageThreadType.PARENT : MessageThreadType.STUDENT;

  if (!applicationId || !message) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true },
  });

  if (!application) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  const note = await prisma.applicationNote.create({
    data: {
      applicationId,
      senderUserId: admin.id,
      threadType,
      noteType: ApplicationNoteType.MESSAGE,
      senderRole: UserRole.ADMIN,
      senderName: "الإدارة",
      body: message,
    },
    include: {
      senderUser: {
        select: {
          role: true,
          mobileNumber: true,
        },
      },
    },
  });

  await notifyMessageSent({
    applicationId,
    threadType,
    actorUserId: admin.id,
    actorRole: UserRole.ADMIN,
    actorName: "الإدارة",
  });

  const formatted = formatThreadMessages([note], threadType)[0];

  return NextResponse.json({
    message: {
      ...formatted,
      isCurrentUser: true,
    },
  });
}
