import { NextResponse } from "next/server";
import { addApplicationDiscount, AdminPaymentMutationError } from "@/features/admin/server/payment-mutations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const formData = await request.formData();

  try {
    const result = await addApplicationDiscount({
      applicationId,
      discountType: String(formData.get("discountType") ?? "fixed"),
      amount: Number(formData.get("amount") ?? 0),
      note: String(formData.get("note") ?? "").trim(),
      targets: formData.getAll("discountTargets").map((value) => String(value)).filter(Boolean),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminPaymentMutationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    return NextResponse.json({ error: "discount_failed" }, { status: 500 });
  }
}
