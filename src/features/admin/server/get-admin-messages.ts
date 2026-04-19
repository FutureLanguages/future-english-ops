import { ApplicationNoteType, MessageThreadType, UserRole } from "@prisma/client";
import { getUnreadThreadNotesCount } from "@/features/messages/server/thread";
import { prisma } from "@/lib/db/prisma";
import { getAdminNavItems } from "./nav";

export async function getAdminMessagesViewModel(params: { adminMobileNumber: string }) {
  const applications = await prisma.application.findMany({
    include: {
      studentProfile: true,
      notes: {
        include: {
          senderUser: {
            select: {
              role: true,
              mobileNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const rows = applications
    .map((application) => {
      const latestMessage = application.notes.find(
        (note) => note.noteType === ApplicationNoteType.MESSAGE,
      );
      const unreadCount =
        getUnreadThreadNotesCount({
          role: UserRole.ADMIN,
          threadType: MessageThreadType.STUDENT,
          notes: application.notes,
          lastViewedAt:
            application.adminLastViewedStudentThreadAt ?? application.adminLastViewedNotesAt,
        }) +
        getUnreadThreadNotesCount({
          role: UserRole.ADMIN,
          threadType: MessageThreadType.PARENT,
          notes: application.notes,
          lastViewedAt:
            application.adminLastViewedParentThreadAt ?? application.adminLastViewedNotesAt,
        });

      return {
        applicationId: application.id,
        studentName: application.studentProfile?.fullNameAr ?? "طالب بدون اسم",
        unreadCount,
        latestMessage: latestMessage?.body ?? null,
        latestMessageAt: latestMessage?.createdAt ?? null,
      };
    })
    .sort((left, right) => {
      if (left.unreadCount > 0 && right.unreadCount === 0) {
        return -1;
      }

      if (left.unreadCount === 0 && right.unreadCount > 0) {
        return 1;
      }

      return (right.latestMessageAt?.getTime() ?? 0) - (left.latestMessageAt?.getTime() ?? 0);
    });

  return {
    adminMobileNumber: params.adminMobileNumber,
    navItems: [
      ...getAdminNavItems(),
      { key: "messages", label: "الرسائل", href: "/admin/messages", active: true },
    ],
    rows,
  };
}
