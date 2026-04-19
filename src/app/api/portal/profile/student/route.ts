import { NextResponse } from "next/server";
import { PortalMutationError, updateStudentProfile } from "@/features/portal/server/mutations";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    const result = await updateStudentProfile({
      applicationId: String(formData.get("applicationId") ?? ""),
      fullNameAr: String(formData.get("fullNameAr") ?? "").trim(),
      fullNameEn: String(formData.get("fullNameEn") ?? "").trim(),
      birthDate: String(formData.get("birthDate") ?? "").trim(),
      gender: String(formData.get("gender") ?? "").trim(),
      nationalityMode: String(formData.get("nationalityMode") ?? "other").trim(),
      nationality: String(formData.get("nationality") ?? "").trim(),
      nationalIdNumber: String(formData.get("nationalIdNumber") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      schoolName: String(formData.get("schoolName") ?? "").trim(),
      passportNumber: String(formData.get("passportNumber") ?? "").trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PortalMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "student_profile_failed" }, { status: 500 });
  }
}
