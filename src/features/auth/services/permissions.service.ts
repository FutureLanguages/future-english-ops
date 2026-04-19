import { AllowedUploaderRole, UserRole } from "@prisma/client";
import type {
  ApplicationRecord,
  ApplicationUser,
  DocumentRequirementRecord,
} from "@/types/application";

function isAdmin(user: ApplicationUser): boolean {
  return user.role === UserRole.ADMIN;
}

function ownsApplication(user: ApplicationUser, application: ApplicationRecord): boolean {
  if (user.role === UserRole.STUDENT) {
    return application.studentUserId === user.id;
  }

  if (user.role === UserRole.PARENT) {
    return application.parentUserId === user.id;
  }

  return false;
}

function matchesAllowedUploader(
  userRole: ApplicationUser["role"],
  allowedRoles: AllowedUploaderRole[],
): boolean {
  return allowedRoles.some((allowedRole) => {
    if (allowedRole === AllowedUploaderRole.ADMIN) {
      return userRole === UserRole.ADMIN;
    }

    if (allowedRole === AllowedUploaderRole.STUDENT) {
      return userRole === UserRole.STUDENT;
    }

    return userRole === UserRole.PARENT;
  });
}

export function canViewApplication(user: ApplicationUser, application: ApplicationRecord): boolean {
  return isAdmin(user) || ownsApplication(user, application);
}

export function canEditStudentInfo(user: ApplicationUser, application: ApplicationRecord): boolean {
  if (isAdmin(user)) {
    return true;
  }

  return ownsApplication(user, application) && !application.studentInfoLocked;
}

export function canEditParentInfo(user: ApplicationUser, application: ApplicationRecord): boolean {
  if (isAdmin(user)) {
    return true;
  }

  return ownsApplication(user, application) && !application.parentInfoLocked;
}

export function canUploadDocument(params: {
  user: ApplicationUser;
  application: ApplicationRecord;
  requirement: DocumentRequirementRecord;
}): boolean {
  if (isAdmin(params.user)) {
    return true;
  }

  if (!ownsApplication(params.user, params.application) || params.application.documentsLocked) {
    return false;
  }

  if (params.requirement.allowedUploaderRoles.every((role) => role === AllowedUploaderRole.ADMIN)) {
    return false;
  }

  if (params.user.role === UserRole.STUDENT || params.user.role === UserRole.PARENT) {
    return true;
  }

  return matchesAllowedUploader(params.user.role, params.requirement.allowedUploaderRoles);
}

export function canViewPayments(user: ApplicationUser, application: ApplicationRecord): boolean {
  if (isAdmin(user)) {
    return true;
  }

  if (user.role === UserRole.PARENT) {
    return ownsApplication(user, application);
  }

  if (user.role === UserRole.STUDENT) {
    return ownsApplication(user, application) && application.showPaymentToStudent;
  }

  return false;
}

export function canUploadPaymentReceipt(user: ApplicationUser, application: ApplicationRecord): boolean {
  if (isAdmin(user)) {
    return true;
  }

  return user.role === UserRole.PARENT &&
    ownsApplication(user, application) &&
    !application.documentsLocked;
}

export function canManagePayments(user: ApplicationUser): boolean {
  return isAdmin(user);
}

export function canManageStatus(user: ApplicationUser): boolean {
  return isAdmin(user);
}

export function canSendNote(user: ApplicationUser, application: ApplicationRecord): boolean {
  return isAdmin(user) || ownsApplication(user, application);
}
