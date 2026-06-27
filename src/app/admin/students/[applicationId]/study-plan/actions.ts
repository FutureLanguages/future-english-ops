"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { prisma } from "@/lib/db/prisma";

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function optionalDate(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function updateStudyPlanAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "").trim();

  if (!applicationId) {
    redirect("/admin/students?error=invalid_study_plan");
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true },
  });

  if (!application) {
    redirect("/admin/students?error=application_not_found");
  }

  await prisma.applicationStudyPlan.upsert({
    where: { applicationId },
    update: {
      instituteName: optionalText(formData, "instituteName"),
      instituteBranch: optionalText(formData, "instituteBranch"),
      country: optionalText(formData, "country"),
      city: optionalText(formData, "city"),
      programName: optionalText(formData, "programName"),
      programStartDate: optionalDate(formData, "programStartDate"),
      programEndDate: optionalDate(formData, "programEndDate"),
      housingType: optionalText(formData, "housingType"),
      roomType: optionalText(formData, "roomType"),
      housingNotes: optionalText(formData, "housingNotes"),
      departureDate: optionalDate(formData, "departureDate"),
      arrivalDate: optionalDate(formData, "arrivalDate"),
      airlineName: optionalText(formData, "airlineName"),
      flightNumber: optionalText(formData, "flightNumber"),
    },
    create: {
      applicationId,
      instituteName: optionalText(formData, "instituteName"),
      instituteBranch: optionalText(formData, "instituteBranch"),
      country: optionalText(formData, "country"),
      city: optionalText(formData, "city"),
      programName: optionalText(formData, "programName"),
      programStartDate: optionalDate(formData, "programStartDate"),
      programEndDate: optionalDate(formData, "programEndDate"),
      housingType: optionalText(formData, "housingType"),
      roomType: optionalText(formData, "roomType"),
      housingNotes: optionalText(formData, "housingNotes"),
      departureDate: optionalDate(formData, "departureDate"),
      arrivalDate: optionalDate(formData, "arrivalDate"),
      airlineName: optionalText(formData, "airlineName"),
      flightNumber: optionalText(formData, "flightNumber"),
    },
  });

  revalidatePath(`/admin/students/${applicationId}`);
  revalidatePath(`/admin/students/${applicationId}/study-plan`);
  revalidatePath("/portal/dashboard");
  redirect(`/admin/students/${applicationId}/study-plan?success=study_plan_updated`);
}
