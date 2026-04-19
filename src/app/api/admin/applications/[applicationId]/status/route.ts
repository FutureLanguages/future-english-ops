import { NextResponse } from "next/server";
import {
  AdminWorkspaceMutationError,
  updateApplicationStatus,
} from "@/features/admin/server/workspace-mutations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const formData = await request.formData();

  try {
    const result = await updateApplicationStatus({
      applicationId,
      status: String(formData.get("status") ?? ""),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminWorkspaceMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "status_failed" }, { status: 500 });
  }
}
