"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { FileActionLinks } from "@/components/shared/file-action-links";
import { DocumentStatusBadge } from "@/components/portal/document-status-badge";
import { FileUploadInput } from "@/components/portal/file-upload-input";
import { MAX_UPLOAD_SIZE_LABEL } from "@/lib/storage/upload-limits";

type PaymentReceiptCardProps = {
  applicationId: string;
  latestPaymentNote: string | null;
  canUploadReceipt: boolean;
  receipts: Array<{
    id: string;
    status: "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
    statusLabel: string;
    adminNote: string | null;
    fileAssetId: string;
    fileMimeType: string;
    createdAt: Date;
  }>;
  isDev?: boolean;
};

export function PaymentReceiptCard({
  applicationId,
  latestPaymentNote,
  canUploadReceipt,
  receipts,
  isDev,
}: PaymentReceiptCardProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function messageForError(code?: string) {
    if (code === "missing_file") return "يرجى اختيار ملف الإيصال قبل الإرسال.";
    if (code === "file_too_large") return `حجم الملف أكبر من الحد المسموح (${MAX_UPLOAD_SIZE_LABEL}).`;
    if (code === "unsupported_file_type") return "نوع الملف غير مدعوم. يرجى رفع PDF أو صورة.";
    if (code === "agreement_required") return "يجب الموافقة على الميثاق قبل استكمال البيانات.";
    return "تعذر تنفيذ عملية السداد المطلوبة حالياً.";
  }

  return (
    <section className="rounded-panel bg-white p-5 shadow-soft">
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <div className="mb-4">
        <h3 className="text-lg font-bold text-ink">إيصالات السداد</h3>
        <p className="mt-1 text-sm text-ink/65">
          يمكن رفع عدة إيصالات سداد. تقوم الإدارة بمراجعة كل إيصال بشكل مستقل، بينما يتم تسجيل
          الدفعات الرسمية من قبل الإدارة فقط.
        </p>
      </div>

      <div className="rounded-2xl bg-mist px-4 py-4">
        <div className="mb-1 text-xs font-bold text-ink/55">آخر ملاحظة مرتبطة بالسداد</div>
        <p className="text-sm text-ink/80">
          {latestPaymentNote ?? "لا توجد ملاحظات سداد حالياً."}
        </p>
      </div>

      {canUploadReceipt ? (
        <form
          className="mt-4 flex flex-col gap-3 rounded-2xl bg-mist p-4 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            startTransition(async () => {
              const response = await fetch("/api/portal/payments/receipts", {
                method: "POST",
                body: new FormData(form),
              });
              const payload = (await response.json().catch(() => null)) as { error?: string } | null;
              if (!response.ok) {
                setToast({ tone: "error", message: messageForError(payload?.error) });
                return;
              }

              form.reset();
              setToast({ tone: "success", message: "تم رفع إيصال السداد بنجاح وهو الآن بانتظار المراجعة." });
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="applicationId" value={applicationId} />
          <FileUploadInput name="file" label="إضافة إيصال جديد" />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white"
            title={isDev ? "رفع إيصال جديد - متاح في التطوير" : "رفع إيصال جديد"}
          >
            {isPending ? "جارٍ الرفع..." : "رفع إيصال جديد"}
          </button>
        </form>
      ) : (
        <div className="mt-4 text-sm text-ink/55">رفع الإيصالات غير متاح لهذا الحساب حالياً.</div>
      )}

      <div className="mt-5 space-y-3">
        {receipts.length > 0 ? (
          receipts.map((receipt) => (
            <article key={receipt.id} className="rounded-2xl border border-black/5 bg-sand px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-ink">
                    إيصال بتاريخ{" "}
                    {new Intl.DateTimeFormat("ar-SA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(receipt.createdAt)}
                  </div>
                  <div className="mt-1 text-xs text-ink/55">{receipt.statusLabel}</div>
                </div>
                <DocumentStatusBadge status={receipt.status} />
              </div>

              {receipt.adminNote ? (
                <div className="mt-3 rounded-2xl bg-white px-3 py-3 text-sm text-ink/80">
                  <div className="mb-1 text-xs font-bold text-ink/55">
                    {receipt.status === "REJECTED"
                      ? "سبب الرفض"
                      : receipt.status === "REUPLOAD_REQUESTED"
                        ? "سبب طلب إعادة الرفع"
                        : "ملاحظة الإدارة"}
                  </div>
                  {receipt.adminNote}
                </div>
              ) : null}

              <div className="mt-3 flex items-center gap-3">
                <FileActionLinks
                  fileAssetId={receipt.fileAssetId}
                  mimeType={receipt.fileMimeType}
                  className="inline-flex rounded-full bg-white px-3 py-2 text-xs font-semibold text-pine disabled:cursor-wait disabled:opacity-60"
                  previewLabel="عرض"
                  downloadLabel="تحميل"
                />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-black/5 bg-sand px-4 py-4 text-sm text-ink/65">
            لم يتم رفع أي إيصال بعد.
          </div>
        )}
      </div>
    </section>
  );
}
