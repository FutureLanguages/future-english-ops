"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/features/auth/server/admin-session";
import {
  parsePortalMode,
  parsePortalSurfaceOverrides,
  updateApplicationPortalConfig,
} from "@/features/portal/server/portal-config";
import { prisma } from "@/lib/db/prisma";

export async function updatePortalConfigAction(formData: FormData) {
  const session = await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const mode = parsePortalMode(formData.get("mode"));
  const overrides = parsePortalSurfaceOverrides(formData);

  if (!applicationId || !mode || !overrides) {
    redirect(applicationId ? `/admin/students/${applicationId}/portal-config?error=invalid_config` : "/admin/students?error=invalid_config");
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true },
  });

  if (!application) {
    redirect("/admin/students?error=application_not_found");
  }

  await updateApplicationPortalConfig({
    applicationId,
    executorUserId: session.id,
    mode,
    overrides,
  });

  revalidatePath(`/admin/students/${applicationId}/portal-config`);
  revalidatePath(`/portal/dashboard`);
  redirect(`/admin/students/${applicationId}/portal-config?success=portal_config_updated`);
}
