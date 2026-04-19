import { NextResponse } from "next/server";
import { createStudentAccount } from "@/app/admin/students/new/actions";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        mobileNumber?: string;
        initialName?: string;
      }
    | null;

  const result = await createStudentAccount({
    mobileNumber: body?.mobileNumber ?? "",
    initialName: body?.initialName ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    applicationId: result.applicationId,
  });
}
