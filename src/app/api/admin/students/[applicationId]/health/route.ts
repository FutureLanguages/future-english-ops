import { NextResponse } from "next/server";
import {
  AdminWorkspaceMutationError,
  updateAdminHealthBehaviorProfile,
} from "@/features/admin/server/workspace-mutations";

const healthKeys = [
  "medicalConditions",
  "allergies",
  "medications",
  "sleepDisorders",
  "bedwetting",
  "phobias",
  "requiresSpecialAttention",
] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const formData = await request.formData();

  const healthBehavior = Object.fromEntries(
    healthKeys.map((key) => [
      key,
      {
        hasIssue: formData.get(`${key}HasIssue`) === "yes",
        details: String(formData.get(`${key}Details`) ?? "").trim(),
      },
    ]),
  );

  try {
    const result = await updateAdminHealthBehaviorProfile({
      applicationId,
      healthBehavior,
      parentSupervisorNotes: String(formData.get("parentSupervisorNotes") ?? "").trim(),
      allowStudentView: formData.get("allowStudentView") === "on",
      allowStudentEdit: formData.get("allowStudentEdit") === "on",
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminWorkspaceMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "health_profile_failed" }, { status: 500 });
  }
}
