import { NextResponse } from "next/server";
import {
  AdminWorkspaceMutationError,
  assignAgreementTemplate,
} from "@/features/admin/server/workspace-mutations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const formData = await request.formData();

  try {
    const result = await assignAgreementTemplate({
      applicationId,
      templateId: String(formData.get("templateId") ?? ""),
      assignmentScope: String(formData.get("assignmentScope") ?? "student_parent"),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminWorkspaceMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "agreement_failed" }, { status: 500 });
  }
}
