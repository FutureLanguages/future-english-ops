import { MessageThreadType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { loadPortalApplicationData } from "./load-portal-application";
import { formatThreadMessages, getUnreadThreadNotesCount } from "@/features/messages/server/thread";
import { buildPortalNavItems } from "./nav";
import type { ApplicationUser } from "@/types/application";
import type { PortalNavItem } from "@/types/portal";

export type PortalMessagesViewModel = {
  role: "STUDENT" | "PARENT";
  mobileNumber: string;
  activeUserLabel: string;
  studentName: string;
  status: "NEW" | "INCOMPLETE" | "UNDER_REVIEW" | "WAITING_PAYMENT" | "COMPLETED";
  overallCompletion: {
    percent: number;
    label: string;
    tone: "complete" | "incomplete";
  };
  navItems: PortalNavItem[];
  applicationOptions: Array<{ id: string; label: string }>;
  selectedApplicationId: string;
  activeThreadType: "STUDENT" | "PARENT";
  threads: Array<{
    type: "STUDENT" | "PARENT";
    label: string;
    unreadCount: number;
    messages: Array<{
    id: string;
    body: string;
    createdAt: Date;
    threadType: "STUDENT" | "PARENT";
    senderRole: "ADMIN" | "STUDENT" | "PARENT";
    senderLabel: string;
    senderMobileNumber: string;
    isAdminMessage: boolean;
    isCurrentUser: boolean;
    seen: boolean;
    read: boolean;
    }>;
    lastActivityAt: Date | null;
  }>;
};

function isSeenByOtherSide(params: {
  message: { createdAt: Date; senderRole: UserRole };
  currentRole: UserRole;
  threadType: MessageThreadType;
  selectedApplication: NonNullable<Awaited<ReturnType<typeof loadPortalApplicationData>>>["applications"][number] | undefined;
}) {
  if (params.message.senderRole !== params.currentRole) {
    return false;
  }

  const adminSeenAt =
    params.threadType === MessageThreadType.PARENT
      ? params.selectedApplication?.adminLastViewedParentThreadAt ?? params.selectedApplication?.adminLastViewedNotesAt
      : params.selectedApplication?.adminLastViewedStudentThreadAt ?? params.selectedApplication?.adminLastViewedNotesAt;

  return Boolean(adminSeenAt && params.message.createdAt <= adminSeenAt);
}

export async function getPortalMessagesViewModel(params: {
  user: ApplicationUser;
  applicationId?: string;
  threadType?: string;
}): Promise<PortalMessagesViewModel | null> {
  const data = await loadPortalApplicationData(params);

  if (!data) {
    return null;
  }

  const requestedThread =
    params.threadType === MessageThreadType.PARENT && data.user.role === UserRole.PARENT
      ? MessageThreadType.PARENT
      : MessageThreadType.STUDENT;

  await prisma.application.update({
    where: { id: data.applicationRecord.id },
    data:
      data.user.role === UserRole.STUDENT
        ? {
            studentLastViewedNotesAt: new Date(),
            studentLastViewedStudentThreadAt: new Date(),
          }
        : requestedThread === MessageThreadType.PARENT
          ? {
              parentLastViewedNotesAt: new Date(),
              parentLastViewedParentThreadAt: new Date(),
            }
          : {
              parentLastViewedNotesAt: new Date(),
              parentLastViewedStudentThreadAt: new Date(),
            },
  });

  const selectedApplication = data.applications.find(
    (application) => application.id === data.applicationRecord.id,
  );
  const notes = selectedApplication?.notes ?? [];
  const visibleThreadTypes =
    data.user.role === UserRole.PARENT
      ? [MessageThreadType.STUDENT, MessageThreadType.PARENT]
      : [MessageThreadType.STUDENT];

  return {
    role: data.user.role as "STUDENT" | "PARENT",
    mobileNumber: data.user.mobileNumber,
    activeUserLabel: data.user.role === "STUDENT" ? "طالب" : "ولي أمر",
    studentName: data.applicationRecord.studentProfile?.fullNameAr ?? "طالب بدون اسم",
    status: data.applicationRecord.status,
    overallCompletion: {
      percent: data.overallCompletionPercent,
      label: data.overallCompletionPercent === 100 ? "اكتمال الطلب" : "اكتمال جزئي",
      tone: data.overallCompletionPercent === 100 ? "complete" : "incomplete",
    },
    navItems: buildPortalNavItems({
      activeKey: "messages",
      canSeePayments: data.canSeePayments,
      applicationId: data.applicationRecord.id,
      agreements: data.applications.find((application) => application.id === data.applicationRecord.id)?.agreements ?? [],
    }),
    applicationOptions: data.applications.map((application) => ({
      id: application.id,
      label: application.studentProfile?.fullNameAr ?? "طلب بدون اسم",
    })),
    selectedApplicationId: data.applicationRecord.id,
    activeThreadType: requestedThread,
    threads: visibleThreadTypes.map((threadType) => ({
      type: threadType,
      label: threadType === MessageThreadType.STUDENT ? "محادثة الطالب" : "محادثة ولي الأمر",
      unreadCount: getUnreadThreadNotesCount({
        role: data.user.role,
        threadType,
        notes,
        lastViewedAt:
          data.user.role === UserRole.STUDENT
            ? selectedApplication?.studentLastViewedStudentThreadAt ?? selectedApplication?.studentLastViewedNotesAt
            : threadType === MessageThreadType.PARENT
              ? selectedApplication?.parentLastViewedParentThreadAt ?? selectedApplication?.parentLastViewedNotesAt
              : selectedApplication?.parentLastViewedStudentThreadAt ?? selectedApplication?.parentLastViewedNotesAt,
      }),
      lastActivityAt:
        notes
          .filter((note) => (note.threadType ?? MessageThreadType.STUDENT) === threadType)
          .filter((note) => note.noteType === "MESSAGE")
          .map((note) => note.createdAt)
          .sort((left, right) => right.getTime() - left.getTime())[0] ?? null,
      messages: formatThreadMessages(notes, threadType).map((message) => ({
        ...message,
        isCurrentUser: message.senderRole === data.user.role,
        seen: isSeenByOtherSide({
          message,
          currentRole: data.user.role,
          threadType,
          selectedApplication,
        }),
        read:
          message.senderRole === data.user.role
            ? true
            : Boolean(
                (
                  data.user.role === UserRole.STUDENT
                    ? selectedApplication?.studentLastViewedStudentThreadAt ?? selectedApplication?.studentLastViewedNotesAt
                    : threadType === MessageThreadType.PARENT
                      ? selectedApplication?.parentLastViewedParentThreadAt ?? selectedApplication?.parentLastViewedNotesAt
                      : selectedApplication?.parentLastViewedStudentThreadAt ?? selectedApplication?.parentLastViewedNotesAt
                ) && message.createdAt <= (
                  data.user.role === UserRole.STUDENT
                    ? selectedApplication?.studentLastViewedStudentThreadAt ?? selectedApplication?.studentLastViewedNotesAt
                    : threadType === MessageThreadType.PARENT
                      ? selectedApplication?.parentLastViewedParentThreadAt ?? selectedApplication?.parentLastViewedNotesAt
                      : selectedApplication?.parentLastViewedStudentThreadAt ?? selectedApplication?.parentLastViewedNotesAt
                )!
              ),
      })),
    })),
  };
}
