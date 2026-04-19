import { NextResponse } from "next/server";
import { PortalMutationError, uploadPortalDocument } from "@/features/portal/server/mutations";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  try {
    const result = await uploadPortalDocument({
      applicationId: String(formData.get("applicationId") ?? ""),
      requirementCode: String(formData.get("requirementCode") ?? ""),
      file,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PortalMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "document_upload_failed" }, { status: 500 });
  }
}
