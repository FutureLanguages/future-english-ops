import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { updateSmallFinancialAdjustmentThresholdSar } from "@/features/payments/server/small-difference";

export async function POST(request: Request) {
  await getAdminSession();

  const formData = await request.formData();
  const threshold = Number(formData.get("thresholdSar"));

  try {
    const value = await updateSmallFinancialAdjustmentThresholdSar(threshold);
    return NextResponse.json({ value });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_threshold") {
      return NextResponse.json({ error: "invalid_threshold" }, { status: 400 });
    }

    console.error("SMALL_FINANCIAL_THRESHOLD_UPDATE_ERROR", error);
    return NextResponse.json({ error: "threshold_update_failed" }, { status: 500 });
  }
}
