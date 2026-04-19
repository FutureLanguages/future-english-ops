"use server";

import { redirect } from "next/navigation";
import {
  getPostLoginRedirectPath,
  requireAuthenticatedSession,
  setAuthSessionCookie,
} from "@/features/auth/server/session";
import {
  hashPassword,
  validatePasswordRules,
  verifyPassword,
} from "@/features/auth/server/passwords";
import { prisma } from "@/lib/db/prisma";

export async function changePasswordAction(formData: FormData) {
  const session = await requireAuthenticatedSession();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect("/auth/change-password?error=missing_fields");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      role: true,
      mobileNumber: true,
      passwordHash: true,
      mustChangePassword: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  const currentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);

  if (!currentPasswordValid) {
    redirect("/auth/change-password?error=invalid_current_password");
  }

  if (newPassword !== confirmPassword) {
    redirect("/auth/change-password?error=password_mismatch");
  }

  if (await verifyPassword(newPassword, user.passwordHash)) {
    redirect("/auth/change-password?error=same_password");
  }

  const passwordRules = validatePasswordRules(newPassword);

  if (!passwordRules.valid) {
    redirect("/auth/change-password?error=weak_password");
  }

  const newPasswordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newPasswordHash,
      mustChangePassword: false,
    },
  });

  const updatedSession = {
    id: user.id,
    role: user.role,
    mobileNumber: user.mobileNumber,
    mustChangePassword: false,
  };

  await setAuthSessionCookie(updatedSession);

  redirect(getPostLoginRedirectPath(updatedSession));
}
