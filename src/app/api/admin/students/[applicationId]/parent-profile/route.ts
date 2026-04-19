import { NextResponse } from "next/server";
import {
  AdminWorkspaceMutationError,
  updateAdminParentProfile,
} from "@/features/admin/server/workspace-mutations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const formData = await request.formData();

  try {
    const result = await updateAdminParentProfile({
      applicationId,
      parentType: String(formData.get("parentType") ?? "").trim(),
      fullName: String(formData.get("fullName") ?? "").trim(),
      mobileNumber: String(formData.get("mobileNumber") ?? "").trim(),
      passportNumber: String(formData.get("passportNumber") ?? "").trim(),
      nationalIdNumber: String(formData.get("nationalIdNumber") ?? "").trim(),
      relationToStudent: String(formData.get("relationToStudent") ?? "").trim(),
      note: String(formData.get("note") ?? "").trim(),
      isDeceased: formData.get("isDeceased") === "on",
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminWorkspaceMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "parent_profile_failed" }, { status: 500 });
  }
}
