import { NextResponse } from "next/server";
import { addApplicationFee, AdminPaymentMutationError } from "@/features/admin/server/payment-mutations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const formData = await request.formData();

  try {
    const result = await addApplicationFee({
      applicationId,
      presetTitle: String(formData.get("presetTitle") ?? ""),
      customTitle: String(formData.get("customTitle") ?? "").trim(),
      amount: Number(formData.get("amount") ?? 0),
      note: String(formData.get("note") ?? "").trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminPaymentMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "fee_failed" }, { status: 500 });
  }
}
