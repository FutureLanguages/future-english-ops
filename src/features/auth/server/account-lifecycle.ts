import { ParentType, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { buildDefaultPasswordFromMobile, hashPassword } from "@/features/auth/server/passwords";

function buildPendingParentMobile(studentMobile: string) {
  const suffix = studentMobile.replace(/\D/g, "").slice(-6).padStart(6, "0");
  return `pending-parent-${suffix}-${Date.now()}`;
}

export async function createPendingParentUser(tx: Prisma.TransactionClient, studentMobile: string) {
  const placeholderPassword = await hashPassword(`pending-${studentMobile}`);

  return tx.user.create({
    data: {
      mobileNumber: buildPendingParentMobile(studentMobile),
      passwordHash: placeholderPassword,
      mustChangePassword: false,
      role: UserRole.PARENT,
      isActive: false,
    },
  });
}

export async function prepareStudentCreation(params: {
  mobileNumber: string;
  initialName?: string | null;
}) {
  const normalizedMobile = params.mobileNumber.trim();
  const existingUser = await prisma.user.findUnique({
    where: {
      mobileNumber: normalizedMobile,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new Error("duplicate_student_mobile");
  }

  return {
    mobileNumber: normalizedMobile,
    initialName: params.initialName?.trim() || null,
    studentPasswordHash: await hashPassword(buildDefaultPasswordFromMobile(normalizedMobile)),
    pendingParentPasswordHash: await hashPassword(`pending-${normalizedMobile}`),
    pendingParentMobile: buildPendingParentMobile(normalizedMobile),
  };
}

export async function createStudentWithApplication(params: {
  tx: Prisma.TransactionClient;
  prepared: Awaited<ReturnType<typeof prepareStudentCreation>>;
}) {
  const pendingParent = await params.tx.user.create({
    data: {
      mobileNumber: params.prepared.pendingParentMobile,
      passwordHash: params.prepared.pendingParentPasswordHash,
      mustChangePassword: false,
      role: UserRole.PARENT,
      isActive: false,
    },
    select: {
      id: true,
    },
  });

  const student = await params.tx.user.create({
    data: {
      mobileNumber: params.prepared.mobileNumber,
      passwordHash: params.prepared.studentPasswordHash,
      mustChangePassword: true,
      role: UserRole.STUDENT,
    },
    select: {
      id: true,
    },
  });

  const application = await params.tx.application.create({
    data: {
      studentUserId: student.id,
      parentUserId: pendingParent.id,
    },
    select: {
      id: true,
    },
  });

  if (params.prepared.initialName) {
    await params.tx.studentProfile.create({
      data: {
        applicationId: application.id,
        fullNameAr: params.prepared.initialName,
      },
    });
  }

  return {
    id: student.id,
    studentApplications: {
      id: application.id,
    },
  };
}

export async function findOrCreateParentAccountByMobile(params: {
  tx: Prisma.TransactionClient;
  mobileNumber: string;
  newParentPasswordHash?: string;
}) {
  const normalizedMobile = params.mobileNumber.trim();
  const existingParent = await params.tx.user.findUnique({
    where: {
      mobileNumber: normalizedMobile,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (existingParent) {
    if (existingParent.role !== UserRole.PARENT) {
      return {
        id: existingParent.id,
        created: false,
        error: "mobile_in_use_by_other_account" as const,
      };
    }

    return {
      id: existingParent.id,
      created: false,
      error: null,
    };
  }

  const passwordHash =
    params.newParentPasswordHash ??
    (await hashPassword(buildDefaultPasswordFromMobile(normalizedMobile)));
  const newParent = await params.tx.user.create({
    data: {
      mobileNumber: normalizedMobile,
      passwordHash,
      mustChangePassword: true,
      role: UserRole.PARENT,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  return {
    id: newParent.id,
    created: true,
    error: null,
  };
}

export async function resolveParentAccountByMobile(mobileNumber: string) {
  const normalizedMobile = mobileNumber.trim();
  const existingUser = await prisma.user.findUnique({
    where: {
      mobileNumber: normalizedMobile,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!existingUser) {
    return {
      kind: "create_new" as const,
      mobileNumber: normalizedMobile,
    };
  }

  if (existingUser.role !== UserRole.PARENT) {
    return {
      kind: "non_parent_conflict" as const,
      mobileNumber: normalizedMobile,
    };
  }

  return {
    kind: "reuse_parent" as const,
    mobileNumber: normalizedMobile,
    parentUserId: existingUser.id,
  };
}

export async function applyParentLinkForApplication(params: {
  tx: Prisma.TransactionClient;
  applicationId: string;
  parentType: ParentType;
  fullName?: string | null;
  mobileNumber: string;
  currentParentUser?: {
    id: string;
    isActive: boolean;
    role: UserRole;
  } | null;
  resolution:
    | {
        kind: "reuse_parent";
        mobileNumber: string;
        parentUserId: string;
      }
    | {
        kind: "create_new";
        mobileNumber: string;
      };
  newParentPasswordHash?: string;
  profilePayload?: {
    passportNumber?: string | null;
    nationalIdNumber?: string | null;
    relationToStudent?: string | null;
    note?: string | null;
    isDeceased?: boolean;
  };
}) {
  let parentUserId =
    params.resolution.kind === "reuse_parent" ? params.resolution.parentUserId : null;

  if (!parentUserId) {
    const createdParent = await params.tx.user.create({
      data: {
        mobileNumber: params.resolution.mobileNumber,
        passwordHash:
          params.newParentPasswordHash ??
          (await hashPassword(buildDefaultPasswordFromMobile(params.resolution.mobileNumber))),
        mustChangePassword: true,
        role: UserRole.PARENT,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    parentUserId = createdParent.id;
  }

  const canRelinkParentAccount =
    !params.currentParentUser ||
    !params.currentParentUser.isActive ||
    params.currentParentUser.role !== UserRole.PARENT ||
    params.currentParentUser.id === parentUserId;

  if (canRelinkParentAccount) {
    await params.tx.application.update({
      where: {
        id: params.applicationId,
      },
      data: {
        parentUserId,
      },
    });
  }

  await params.tx.parentProfile.upsert({
    where: {
      applicationId_type: {
        applicationId: params.applicationId,
        type: params.parentType,
      },
    },
    update: {
      fullName: params.fullName?.trim() || null,
      mobileNumber: params.mobileNumber.trim(),
      passportNumber: params.profilePayload?.passportNumber ?? undefined,
      nationalIdNumber: params.profilePayload?.nationalIdNumber ?? undefined,
      relationToStudent: params.profilePayload?.relationToStudent ?? undefined,
      note: params.profilePayload?.note ?? undefined,
      isDeceased: params.profilePayload?.isDeceased ?? undefined,
    },
    create: {
      applicationId: params.applicationId,
      type: params.parentType,
      fullName: params.fullName?.trim() || null,
      mobileNumber: params.mobileNumber.trim(),
      passportNumber: params.profilePayload?.passportNumber ?? null,
      nationalIdNumber: params.profilePayload?.nationalIdNumber ?? null,
      relationToStudent: params.profilePayload?.relationToStudent ?? null,
      note: params.profilePayload?.note ?? null,
      isDeceased: params.profilePayload?.isDeceased ?? false,
    },
  });

  return {
    parentUserId,
    created: params.resolution.kind === "create_new",
    error: null,
  };
}

export async function resetUserPassword(params: {
  tx: Prisma.TransactionClient;
  userId: string;
  nextPassword?: string | null;
  forceChange?: boolean;
}) {
  const user = await params.tx.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      mobileNumber: true,
    },
  });

  if (!user) {
    throw new Error("user_not_found");
  }

  const nextPassword =
    params.nextPassword && params.nextPassword.trim().length > 0
      ? params.nextPassword
      : buildDefaultPasswordFromMobile(user.mobileNumber);

  const passwordHash = await hashPassword(nextPassword);

  await params.tx.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: params.forceChange ?? true,
    },
  });

  return {
    plainPassword: nextPassword,
  };
}
