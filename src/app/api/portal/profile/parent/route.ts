import { NextResponse } from "next/server";
import { PortalMutationError, updateParentProfile } from "@/features/portal/server/mutations";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    const result = await updateParentProfile({
      applicationId: String(formData.get("applicationId") ?? ""),
      parentType: String(formData.get("parentType") ?? ""),
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
    if (error instanceof PortalMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "parent_profile_failed" }, { status: 500 });
  }
}
