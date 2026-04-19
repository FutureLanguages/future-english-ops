import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { generateExcelExport, generatePdfExport } from "@/features/admin/server/export-data";

export async function GET(request: Request) {
  await getAdminSession();

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "pdf" ? "pdf" : "xlsx";
  const dataTypes = searchParams.getAll("dataTypes");
  const fields = searchParams.getAll("fields");
  const selectedIds = searchParams.getAll("selectedIds");

  if (dataTypes.length === 0) {
    return NextResponse.json({ error: "missing_data_types" }, { status: 400 });
  }

  const filters = {
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    view: searchParams.get("view") ?? undefined,
    scope: searchParams.get("scope") ?? undefined,
    selectedIds,
    scopeStatus: searchParams.get("scopeStatus") ?? undefined,
  };

  const fileBuffer =
    format === "pdf"
      ? await generatePdfExport({ filters, dataTypes, fields })
      : await generateExcelExport({ filters, dataTypes, fields });

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type":
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="future-english-export.${format}"`,
    },
  });
}
