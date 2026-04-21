import { NextResponse } from "next/server";
import { PortalMutationError, updateHealthBehaviorProfile } from "@/features/portal/server/mutations";

const healthKeys = [
  "medicalConditions",
  "sleepDisorders",
  "allergies",
  "continuousMedication",
  "phobia",
  "bedwetting",
  "needsSpecialSupervisorFollowUp",
] as const;

export async function POST(request: Request) {
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
    const result = await updateHealthBehaviorProfile({
      applicationId: String(formData.get("applicationId") ?? ""),
      healthBehavior,
      parentSupervisorNotes: String(formData.get("parentSupervisorNotes") ?? "").trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PortalMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "health_profile_failed" }, { status: 500 });
  }
}
