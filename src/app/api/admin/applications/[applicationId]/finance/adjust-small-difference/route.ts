import { NextResponse } from "next/server";
import {
  adjustSmallFinancialDifference,
  AdminPaymentMutationError,
} from "@/features/admin/server/payment-mutations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const formData = await request.formData();

  try {
    const result = await adjustSmallFinancialDifference({
      applicationId,
      targetFeeId: String(formData.get("targetFeeId") ?? ""),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminPaymentMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    console.error("SMALL_FINANCIAL_ADJUSTMENT_ERROR", error);
    return NextResponse.json({ error: "adjustment_failed" }, { status: 500 });
  }
}
