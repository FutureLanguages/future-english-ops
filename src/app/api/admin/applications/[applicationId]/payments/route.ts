import { NextResponse } from "next/server";
import { addApplicationPayment, AdminPaymentMutationError } from "@/features/admin/server/payment-mutations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const formData = await request.formData();

  try {
    const result = await addApplicationPayment({
      applicationId,
      amount: Number(formData.get("amount") ?? 0),
      paymentDate: String(formData.get("paymentDate") ?? ""),
      note: String(formData.get("note") ?? "").trim(),
      linkedReceiptId: String(formData.get("linkedReceiptId") ?? "").trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminPaymentMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "payment_failed" }, { status: 500 });
  }
}
