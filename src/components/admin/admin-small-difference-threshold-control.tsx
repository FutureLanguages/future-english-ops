"use client";

import { useState } from "react";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { maxSmallFinancialDifferenceThresholdSar } from "@/features/payments/constants";

export function AdminSmallDifferenceThresholdControl({
  initialValue,
}: {
  initialValue: number;
}) {
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function submitThreshold(form: HTMLFormElement) {
    if (pending) {
      return;
    }

    setPending(true);
    setToast(null);

    try {
      const response = await fetch("/api/admin/finance/small-difference-threshold", {
        method: "POST",
        body: new FormData(form),
      });
      const payload = (await response.json().catch(() => null)) as {
        value?: number;
        error?: string;
      } | null;

      if (!response.ok || typeof payload?.value !== "number") {
        setToast({
          tone: "error",
          message: payload?.error === "invalid_threshold"
            ? `أدخل قيمة صحيحة للفروقات المالية بين 1 و ${maxSmallFinancialDifferenceThresholdSar} ر.س.`
            : "تعذر تحديث حد الفروقات المالية حالياً.",
        });
        return;
      }

      setValue(payload.value);
      setToast({ tone: "success", message: "تم تحديث حد الفروقات المالية." });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-panel border border-black/10 bg-white p-5 shadow-soft">
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">الفروقات المالية</h2>
          <p className="mt-1 text-sm text-ink/60">
            حد إداري عام لإظهار إجراء التسوية للفروقات الصغيرة فقط.
          </p>
          <div className="mt-3 inline-flex rounded-2xl bg-sand px-4 py-3 text-sm font-bold text-ink">
            الحد الحالي: {value} ر.س
          </div>
        </div>

        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            submitThreshold(event.currentTarget);
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">تعديل الحد</span>
            <input
              type="number"
              name="thresholdSar"
              min="0.01"
              max={maxSmallFinancialDifferenceThresholdSar}
              step="0.01"
              defaultValue={value}
              className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none sm:w-40"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </form>
      </div>
    </section>
  );
}
