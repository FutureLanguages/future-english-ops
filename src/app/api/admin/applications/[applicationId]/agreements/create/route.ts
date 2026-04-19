import { NextResponse } from "next/server";
import {
  AdminWorkspaceMutationError,
  createAndAssignAgreement,
} from "@/features/admin/server/workspace-mutations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const formData = await request.formData();

  try {
    const result = await createAndAssignAgreement({
      applicationId,
      title: String(formData.get("title") ?? "").trim(),
      content: String(formData.get("content") ?? "").trim(),
      acknowledgmentText: String(formData.get("acknowledgmentText") ?? "").trim(),
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
