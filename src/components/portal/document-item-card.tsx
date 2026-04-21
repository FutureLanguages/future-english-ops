"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DocumentCategory } from "@prisma/client";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { DocumentStatusBadge } from "@/components/portal/document-status-badge";
import { FileUploadInput } from "@/components/portal/file-upload-input";
import { isPreviewableMimeType } from "@/lib/storage/file-preview";
import { MAX_UPLOAD_SIZE_LABEL } from "@/lib/storage/upload-limits";

type PortalDocumentItem = {
  requirementId: string;
  requirementCode: string;
  applicationId: string;
  titleAr: string;
  descriptionAr: string | null;
  status: "MISSING" | "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
  adminNote: string | null;
  fileAssetId: string | null;
  fileMimeType: string | null;
  canUpload: boolean;
  actionLabel: string | null;
  category: DocumentCategory;
};

export function DocumentItemCard({ item, isDev }: { item: PortalDocumentItem; isDev?: boolean }) {
  const canShowUploadForm = item.canUpload && item.actionLabel && item.status !== "APPROVED";
  const canPreview = isPreviewableMimeType(item.fileMimeType);
  const router = useRouter();
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function messageForError(code?: string) {
    if (code === "missing_file") return "يرجى اختيار ملف قبل الإرسال.";
    if (code === "file_too_large") return `حجم الملف أكبر من الحد المسموح (${MAX_UPLOAD_SIZE_LABEL}).`;
    if (code === "unsupported_file_type") return "نوع الملف غير مدعوم. يرجى رفع PDF أو صورة.";
    if (code === "already_approved") return "هذا المستند معتمد بالفعل ولا يحتاج إلى رفع جديد.";
    if (code === "agreement_required") return "يجب الموافقة على الميثاق قبل استكمال البيانات.";
    return "تعذر تنفيذ عملية المستند المطلوبة حالياً.";
  }

  return (
    <article className="rounded-panel bg-white p-4 shadow-soft">
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink">{item.titleAr}</h3>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            {item.descriptionAr ?? "لا يوجد وصف إضافي لهذا المستند."}
          </p>
        </div>
        <DocumentStatusBadge status={item.status} />
      </div>

      {item.adminNote ? (
        <div className="mt-3 rounded-2xl bg-sand px-3 py-3">
          <div className="mb-1 text-xs font-bold text-ink/55">
            {item.status === "REJECTED"
              ? "سبب الرفض"
              : item.status === "REUPLOAD_REQUESTED"
                ? "سبب طلب إعادة الرفع"
                : "ملاحظة الإدارة"}
          </div>
          <p className="text-sm text-ink/80">{item.adminNote}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <div className="text-xs font-medium text-ink/45">
            {item.category === "STUDENT"
              ? "مستند الطالب"
              : item.category === "PARENT"
                ? "مستند ولي الأمر"
                : "مستند الوصاية"}
          </div>
          {item.fileAssetId ? (
            <div className="flex items-center gap-3">
              {canPreview ? (
                <Link
                  href={`/api/files/${item.fileAssetId}/view`}
                  target="_blank"
                  title="عرض الملف داخل المتصفح"
                  className="inline-flex rounded-full bg-mist px-3 py-2 text-xs font-semibold text-pine"
                >
                  عرض
                </Link>
              ) : null}
              <Link
                href={`/api/files/${item.fileAssetId}/download`}
                title="تحميل الملف"
                className="inline-flex rounded-full bg-mist px-3 py-2 text-xs font-semibold text-pine"
              >
                تحميل
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-mist px-3 py-3 text-xs text-ink/55">
              لم يتم رفع ملف لهذا المستند بعد.
            </div>
          )}
        </div>

        {canShowUploadForm ? (
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              startTransition(async () => {
                const response = await fetch("/api/portal/documents/upload", {
                  method: "POST",
                  body: new FormData(form),
                });
                const payload = (await response.json().catch(() => null)) as { error?: string } | null;
                if (!response.ok) {
                  setToast({ tone: "error", message: messageForError(payload?.error) });
                  return;
                }

                form.reset();
                setToast({ tone: "success", message: "تم رفع المستند بنجاح وهو الآن بانتظار المراجعة." });
                router.refresh();
              });
            }}
          >
            <input type="hidden" name="applicationId" value={item.applicationId} />
            <input type="hidden" name="requirementCode" value={item.requirementCode} />
            <FileUploadInput
              name="file"
              label="اختر الملف"
              className="max-w-[220px] text-xs text-ink/70 file:ml-2 file:rounded-full file:border-0 file:bg-mist file:px-3 file:py-2 file:text-xs file:font-semibold file:text-pine"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white"
              title={isDev ? `${item.actionLabel} - متاح في التطوير` : item.actionLabel ?? undefined}
            >
              {isPending ? "جارٍ الرفع..." : item.actionLabel}
            </button>
          </form>
        ) : (
          <span className="text-sm font-semibold text-ink/40">
            {item.status === "APPROVED" ? "لا يوجد إجراء" : "لا يمكن الرفع من هذا الحساب"}
          </span>
        )}
      </div>
    </article>
  );
}
