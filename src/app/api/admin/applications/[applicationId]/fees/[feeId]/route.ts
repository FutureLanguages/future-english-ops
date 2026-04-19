import { NextResponse } from "next/server";
import {
  AdminPaymentMutationError,
  deleteApplicationFee,
  updateApplicationFee,
} from "@/features/admin/server/payment-mutations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string; feeId: string }> },
) {
  const { applicationId, feeId } = await params;
  const formData = await request.formData();

  try {
    const result = await updateApplicationFee({
      applicationId,
      feeId,
      title: String(formData.get("title") ?? "").trim(),
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string; feeId: string }> },
) {
  const { applicationId, feeId } = await params;

  try {
    const result = await deleteApplicationFee({
      applicationId,
      feeId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminPaymentMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "fee_failed" }, { status: 500 });
  }
}
