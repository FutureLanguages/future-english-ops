import {
  MessageThreadType,
  NotificationType,
  UserRole,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type NotificationClient = Prisma.TransactionClient | typeof prisma;

const roleLabels = {
  ADMIN: "الإدارة",
  STUDENT: "الطالب",
  PARENT: "ولي الأمر",
} as const;

function actorRoleValue(role: UserRole) {
  return role.toLowerCase();
}

function actorLabel(role: UserRole, name?: string | null) {
  if (role === UserRole.ADMIN) {
    return "الإدارة";
  }

  return `(${roleLabels[role]}) ${name || "بدون اسم"}`;
}

function uniqueRecipients(userIds: Array<string | null | undefined>, actorUserId?: string) {
  return Array.from(new Set(userIds.filter((userId): userId is string => Boolean(userId)))).filter(
    (userId) => userId !== actorUserId,
  );
}

export async function getUserNotificationSummary(userId: string) {
  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
    prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        actorName: true,
        actorRole: true,
        isRead: true,
        link: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    unreadCount,
    notifications: notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    })),
  };
}

export async function getUserNotifications(params: {
  userId: string;
  type?: NotificationType;
}) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId: params.userId,
      ...(params.type ? { type: params.type } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      actorName: true,
      actorRole: true,
      isRead: true,
      link: true,
      createdAt: true,
    },
  });

  return notifications.map((notification) => ({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  }));
}

export async function createNotificationsForUsers(params: {
  tx?: NotificationClient;
  userIds: string[];
  actorUserId?: string;
  title: string;
  description?: string | null;
  type: NotificationType;
  actorName?: string | null;
  actorRole?: UserRole | string | null;
  link?: string | null;
}) {
  const client = params.tx ?? prisma;
  const recipients = uniqueRecipients(params.userIds, params.actorUserId);

  if (recipients.length === 0) {
    return;
  }

  await client.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      title: params.title,
      description: params.description ?? null,
      type: params.type,
      actorName: params.actorName ?? null,
      actorRole:
        typeof params.actorRole === "string"
          ? params.actorRole.toLowerCase()
          : params.actorRole
            ? actorRoleValue(params.actorRole)
            : null,
      link: params.link ?? null,
    })),
  });
}

export async function notifyMessageSent(params: {
  tx?: NotificationClient;
  applicationId: string;
  threadType: MessageThreadType;
  actorUserId: string;
  actorRole: UserRole;
  actorName: string;
}) {
  const client = params.tx ?? prisma;
  const [application, admins] = await Promise.all([
    client.application.findUnique({
      where: { id: params.applicationId },
      select: {
        id: true,
        studentUserId: true,
        parentUserId: true,
      },
    }),
    params.actorRole === UserRole.ADMIN
      ? Promise.resolve([])
      : client.user.findMany({
          where: {
            role: UserRole.ADMIN,
            isActive: true,
          },
          select: {
            id: true,
          },
        }),
  ]);

  if (!application) {
    return;
  }

  const portalRecipients =
    params.threadType === MessageThreadType.PARENT
      ? [application.parentUserId]
      : [application.studentUserId, application.parentUserId];

  const recipientIds =
    params.actorRole === UserRole.ADMIN
      ? portalRecipients
      : [...admins.map((admin) => admin.id), ...portalRecipients];

  await createNotificationsForUsers({
    tx: client,
    userIds: recipientIds,
    actorUserId: params.actorUserId,
    title: `رسالة جديدة من ${actorLabel(params.actorRole, params.actorName)}`,
    description:
      params.threadType === MessageThreadType.PARENT ? "محادثة ولي الأمر" : "محادثة الطالب",
    type: NotificationType.MESSAGE,
    actorName: params.actorName,
    actorRole: params.actorRole,
    link:
      params.actorRole === UserRole.ADMIN
        ? `/portal/messages?applicationId=${params.applicationId}&thread=${params.threadType.toLowerCase()}`
        : `/admin/students/${params.applicationId}#messages-${params.threadType.toLowerCase()}`,
  });
}

export async function notifyAdminsOfDocumentUpload(params: {
  tx?: NotificationClient;
  applicationId: string;
  actorUserId: string;
  actorRole: UserRole;
  actorName: string;
  documentTitle: string;
  isPaymentReceipt?: boolean;
}) {
  const client = params.tx ?? prisma;
  const admins = await client.user.findMany({
    where: {
      role: UserRole.ADMIN,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  await createNotificationsForUsers({
    tx: client,
    userIds: admins.map((admin) => admin.id),
    actorUserId: params.actorUserId,
    title: params.isPaymentReceipt
      ? `إيصال دفع جديد من ${actorLabel(params.actorRole, params.actorName)}`
      : `مستند جديد من ${actorLabel(params.actorRole, params.actorName)}`,
    description: params.documentTitle,
    type: params.isPaymentReceipt ? NotificationType.PAYMENT : NotificationType.DOCUMENT,
    actorName: params.actorName,
    actorRole: params.actorRole,
    link: `/admin/students/${params.applicationId}#${params.isPaymentReceipt ? "payments" : "documents"}`,
  });
}

export async function notifyPortalUsers(params: {
  tx?: NotificationClient;
  applicationId: string;
  actorUserId?: string;
  actorName?: string;
  actorRole?: UserRole;
  title: string;
  description?: string | null;
  type: NotificationType;
  link: string;
}) {
  const client = params.tx ?? prisma;
  const application = await client.application.findUnique({
    where: { id: params.applicationId },
    select: {
      studentUserId: true,
      parentUserId: true,
    },
  });

  if (!application) {
    return;
  }

  await createNotificationsForUsers({
    tx: client,
    userIds: [application.studentUserId, application.parentUserId],
    actorUserId: params.actorUserId,
    title: params.title,
    description: params.description,
    type: params.type,
    actorName: params.actorName ?? "الإدارة",
    actorRole: params.actorRole ?? UserRole.ADMIN,
    link: params.link,
  });
}
