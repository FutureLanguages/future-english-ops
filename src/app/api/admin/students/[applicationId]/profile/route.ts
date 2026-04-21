import { NextResponse } from "next/server";
import {
  AdminWorkspaceMutationError,
  updateAdminStudentProfile,
} from "@/features/admin/server/workspace-mutations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const formData = await request.formData();

  try {
    const result = await updateAdminStudentProfile({
      applicationId,
      mobileNumber: String(formData.get("mobileNumber") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      fullNameAr: String(formData.get("fullNameAr") ?? "").trim(),
      fullNameEn: String(formData.get("fullNameEn") ?? "").trim(),
      birthDate: String(formData.get("birthDate") ?? "").trim(),
      gender: String(formData.get("gender") ?? "").trim(),
      nationalityMode: String(formData.get("nationalityMode") ?? "other").trim(),
      nationality: String(formData.get("nationality") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      schoolName: String(formData.get("schoolName") ?? "").trim(),
      languageLevel: String(formData.get("languageLevel") ?? "").trim(),
      hobbies: String(formData.get("hobbies") ?? "").trim(),
      schoolStage: String(formData.get("schoolStage") ?? "").trim(),
      passportNumber: String(formData.get("passportNumber") ?? "").trim(),
      nationalIdNumber: String(formData.get("nationalIdNumber") ?? "").trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminWorkspaceMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "student_profile_failed" }, { status: 500 });
  }
}
