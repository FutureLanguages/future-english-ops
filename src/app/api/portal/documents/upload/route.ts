import { NextResponse } from "next/server";
import { PortalMutationError, uploadPortalDocument } from "@/features/portal/server/mutations";

export async function POST(request: Request) {
  console.info("[portal-document-upload] start");

  try {
    console.info("[portal-document-upload] parsing formData");
    const formData = await request.formData();

    console.info("[portal-document-upload] extracting file");
    const file = formData.get("file");
    const applicationId = String(formData.get("applicationId") ?? "");
    const requirementCode = String(formData.get("requirementCode") ?? "");

    console.info("[portal-document-upload] validating file existence", {
      hasFile: file instanceof File,
      applicationId,
      requirementCode,
    });

    if (!(file instanceof File) || file.size === 0) {
      console.warn("[portal-document-upload] missing file");
      return NextResponse.json({ error: "missing_file", message: "يرجى اختيار ملف قبل الإرسال" }, { status: 400 });
    }

    console.info("[portal-document-upload] file metadata", {
      size: file.size,
      type: file.type || "application/octet-stream",
      name: file.name,
    });

    console.info("[portal-document-upload] before Supabase upload");
    const result = await uploadPortalDocument({
      applicationId,
      requirementCode,
      file,
    });
    console.info("[portal-document-upload] after Supabase upload", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    if (error instanceof PortalMutationError) {
      return NextResponse.json({ error: error.code, message: "حدث خطأ أثناء رفع الملف" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "document_upload_failed", message: "حدث خطأ أثناء رفع الملف" },
      { status: 500 },
    );
  }
}
