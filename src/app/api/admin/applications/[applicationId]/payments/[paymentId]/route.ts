import { NextResponse } from "next/server";
import {
  AdminPaymentMutationError,
  deleteApplicationPayment,
  updateApplicationPayment,
} from "@/features/admin/server/payment-mutations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string; paymentId: string }> },
) {
  const { applicationId, paymentId } = await params;
  const formData = await request.formData();

  try {
    const result = await updateApplicationPayment({
      applicationId,
      paymentId,
      amount: Number(formData.get("amount") ?? 0),
      paymentDate: String(formData.get("paymentDate") ?? "").trim(),
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string; paymentId: string }> },
) {
  const { applicationId, paymentId } = await params;

  try {
    const result = await deleteApplicationPayment({
      applicationId,
      paymentId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminPaymentMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "payment_failed" }, { status: 500 });
  }
}
