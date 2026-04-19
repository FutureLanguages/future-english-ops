"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";

export function AdminStatusControl({
  applicationId,
  currentStatus,
  options,
}: {
  applicationId: string;
  currentStatus: string;
  options: Array<{ value: string; label: string }>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <form
        className="grid gap-4 lg:grid-cols-[1fr,auto]"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const formData = new FormData();
            formData.set("status", status);

            const response = await fetch(`/api/admin/applications/${applicationId}/status`, {
              method: "POST",
              body: formData,
            });

            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
              setToast({
                tone: "error",
                message:
                  payload?.error === "invalid_status"
                    ? "تعذر تحديث حالة الطلب."
                    : "تعذر حفظ الحالة حالياً.",
              });
              return;
            }

            setToast({ tone: "success", message: "تم تحديث حالة الطلب بنجاح." });
            router.refresh();
          });
        }}
      >
        <div className="rounded-2xl bg-sand p-4">
          <label className="mb-2 block text-sm font-semibold text-ink">الحالة الحالية / الجديدة</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ..." : "حفظ الحالة"}
          </button>
        </div>
      </form>
    </>
  );
}
