import { MessageThreadType, UserRole } from "@prisma/client";
import { getPortalSession } from "@/features/auth/server/portal-session";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { prisma } from "@/lib/db/prisma";
import { getUnreadThreadNotesCount } from "./thread";

export async function getPortalUnreadMessageCount() {
  const user = await getPortalSession();
  const applications = await prisma.application.findMany({
    where:
      user.role === UserRole.STUDENT
        ? { studentUserId: user.id }
        : { parentUserId: user.id },
    include: {
      notes: {
        include: {
          senderUser: {
            select: {
              role: true,
              mobileNumber: true,
            },
          },
        },
      },
    },
  });

  return applications.reduce((sum, application) => {
    if (user.role === UserRole.STUDENT) {
      return (
        sum +
        getUnreadThreadNotesCount({
          role: user.role,
          threadType: MessageThreadType.STUDENT,
          notes: application.notes,
          lastViewedAt:
            application.studentLastViewedStudentThreadAt ?? application.studentLastViewedNotesAt,
        })
      );
    }

    return (
      sum +
      getUnreadThreadNotesCount({
        role: UserRole.PARENT,
        threadType: MessageThreadType.STUDENT,
        notes: application.notes,
        lastViewedAt:
          application.parentLastViewedStudentThreadAt ?? application.parentLastViewedNotesAt,
      }) +
      getUnreadThreadNotesCount({
        role: UserRole.PARENT,
        threadType: MessageThreadType.PARENT,
        notes: application.notes,
        lastViewedAt:
          application.parentLastViewedParentThreadAt ?? application.parentLastViewedNotesAt,
      })
    );
  }, 0);
}

export async function getAdminUnreadMessageCount() {
  await getAdminSession();
  const applications = await prisma.application.findMany({
    include: {
      notes: {
        include: {
          senderUser: {
            select: {
              role: true,
              mobileNumber: true,
            },
          },
        },
      },
    },
  });

  return applications.reduce((sum, application) => {
    return (
      sum +
      getUnreadThreadNotesCount({
        role: UserRole.ADMIN,
        threadType: MessageThreadType.STUDENT,
        notes: application.notes,
        lastViewedAt: application.adminLastViewedStudentThreadAt ?? application.adminLastViewedNotesAt,
      }) +
      getUnreadThreadNotesCount({
        role: UserRole.ADMIN,
        threadType: MessageThreadType.PARENT,
        notes: application.notes,
        lastViewedAt: application.adminLastViewedParentThreadAt ?? application.adminLastViewedNotesAt,
      })
    );
  }, 0);
}
