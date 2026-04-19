import { ApplicationNoteType, MessageThreadType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPortalSession } from "@/features/auth/server/portal-session";
import { formatThreadMessages } from "@/features/messages/server/thread";
import { notifyMessageSent } from "@/features/notifications/server/notifications";
import { prisma } from "@/lib/db/prisma";

function getSenderName(params: {
  role: UserRole;
  mobileNumber: string;
  studentProfile: { fullNameAr: string | null } | null;
  parentProfiles: Array<{ fullName: string | null; mobileNumber: string | null }>;
}) {
  if (params.role === UserRole.STUDENT) {
    return params.studentProfile?.fullNameAr ?? params.mobileNumber;
  }

  return (
    params.parentProfiles.find((profile) => profile.mobileNumber === params.mobileNumber)?.fullName ??
    params.parentProfiles.find((profile) => profile.fullName)?.fullName ??
    params.mobileNumber
  );
}

export async function POST(request: Request) {
  const user = await getPortalSession();
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

  if (user.role === UserRole.STUDENT && threadType !== MessageThreadType.STUDENT) {
    return NextResponse.json({ error: "thread_not_allowed" }, { status: 403 });
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      studentProfile: true,
      parentProfiles: true,
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

  const senderName = getSenderName({
    role: user.role,
    mobileNumber: user.mobileNumber,
    studentProfile: application.studentProfile,
    parentProfiles: application.parentProfiles,
  });

  const note = await prisma.applicationNote.create({
    data: {
      applicationId,
      senderUserId: user.id,
      threadType,
      noteType: ApplicationNoteType.MESSAGE,
      senderRole: user.role,
      senderName,
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
    actorUserId: user.id,
    actorRole: user.role,
    actorName: senderName,
  });

  const formatted = formatThreadMessages([note], threadType)[0];

  return NextResponse.json({
    message: {
      ...formatted,
      isCurrentUser: true,
    },
  });
}
