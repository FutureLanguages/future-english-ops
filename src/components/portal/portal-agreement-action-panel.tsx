"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { SignaturePadField } from "@/components/portal/signature-pad-field";

export function PortalAgreementActionPanel({
  agreement,
  role,
}: {
  role: "STUDENT" | "PARENT";
  agreement: {
    id: string;
    accepted: boolean;
    acceptedAt: Date | string | null;
    fullName: string | null;
    signature: string | null;
    cancellationRequestedAt: Date | string | null;
    acknowledgmentText: string;
    requiresParentAcceptance: boolean;
  };
}) {
  const router = useRouter();
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-panel bg-white p-5 shadow-soft">
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <h2 className="text-lg font-bold text-ink">الإقرار والتوقيع</h2>
      <div className="mt-3 rounded-2xl bg-mist px-4 py-3 text-sm leading-7 text-ink">
        {agreement.acknowledgmentText}
      </div>

      {agreement.cancellationRequestedAt ? (
        <div className="mt-4 rounded-2xl bg-[#fff1ea] px-4 py-4 text-sm text-[#9f4a1f]">
          <div className="font-bold">تم طلب إلغاء الميثاق المعتمد، هل توافق؟</div>
          <p className="mt-2 leading-6">
            في حال الموافقة سيتم حذف هذا الميثاق من الطلب. وإذا رفضت، سيبقى كما هو بدون تغيير.
          </p>
        </div>
      ) : null}

      {role === "PARENT" && !agreement.requiresParentAcceptance ? (
        <div className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm font-semibold text-ink/70">
          هذا الميثاق لا يتطلب موافقة ولي الأمر، وهو مخصص للطالب فقط.
        </div>
      ) : null}

      {agreement.accepted || (role === "PARENT" && !agreement.requiresParentAcceptance) ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-sand px-4 py-3 text-sm font-semibold text-ink">
            {role === "PARENT" && !agreement.requiresParentAcceptance
              ? "لا يلزم أي إجراء من ولي الأمر على هذا الميثاق."
              : "تمت الموافقة على هذا الميثاق ولا يمكن تعديلها أو التراجع عنها."}
          </div>
          {agreement.fullName ? (
            <div className="text-sm text-ink/65">الاسم: {agreement.fullName}</div>
          ) : null}
          {agreement.acceptedAt ? (
            <div className="text-sm text-ink/65">
              وقت الموافقة:{" "}
              {new Intl.DateTimeFormat("ar-SA", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              }).format(new Date(agreement.acceptedAt))}
            </div>
          ) : null}
          {agreement.signature ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agreement.signature}
              alt="التوقيع المحفوظ"
              className="max-h-44 rounded-2xl border border-black/10 bg-sand p-3"
            />
          ) : null}
          {agreement.cancellationRequestedAt ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const formData = new FormData();
                    formData.append("response", "approve");
                    const response = await fetch(`/api/portal/agreements/${agreement.id}/cancellation-response`, {
                      method: "POST",
                      body: formData,
                    });
                    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
                    if (!response.ok) {
                      setToast({ tone: "error", message: payload?.error ?? "تعذر تحديث الطلب حالياً." });
                      return;
                    }

                    setToast({ tone: "success", message: "تمت الموافقة على إلغاء الميثاق." });
                    router.push("/portal/agreements");
                    router.refresh();
                  });
                }}
                className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isPending ? "جارٍ الحفظ..." : "أوافق على الإلغاء"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const formData = new FormData();
                    formData.append("response", "reject");
                    const response = await fetch(`/api/portal/agreements/${agreement.id}/cancellation-response`, {
                      method: "POST",
                      body: formData,
                    });
                    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
                    if (!response.ok) {
                      setToast({ tone: "error", message: payload?.error ?? "تعذر تحديث الطلب حالياً." });
                      return;
                    }

                    setToast({ tone: "success", message: "تم رفض طلب الإلغاء، وسيبقى الميثاق كما هو." });
                    router.refresh();
                  });
                }}
                className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink disabled:opacity-60"
              >
                رفض طلب الإلغاء
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            startTransition(async () => {
              const response = await fetch(`/api/portal/agreements/${agreement.id}/accept`, {
                method: "POST",
                body: new FormData(form),
              });
              const payload = (await response.json().catch(() => null)) as { error?: string } | null;
              if (!response.ok) {
                setToast({ tone: "error", message: payload?.error === "invalid_acceptance" ? "يرجى إكمال الإقرار والاسم والتوقيع قبل الإرسال." : "تعذر حفظ الموافقة حالياً." });
                return;
              }

              setToast({ tone: "success", message: "تم حفظ الموافقة على الميثاق بنجاح." });
              router.refresh();
            });
          }}
        >
          <label className="flex items-start gap-2 rounded-2xl bg-sand px-4 py-3 text-sm font-semibold text-ink">
            <input type="checkbox" name="accepted" required className="mt-1" />
            <span>أقر وأوافق على جميع بنود الميثاق</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">الاسم الكامل</span>
            <input
              name="fullName"
              required
              placeholder="أدخل الاسم الكامل كما يظهر في الهوية أو الجواز"
              className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            />
          </label>
          <SignaturePadField />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ..." : "أوافق وألتزم"}
          </button>
        </form>
      )}
    </section>
  );
}
