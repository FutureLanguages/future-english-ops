"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DocumentCategory } from "@prisma/client";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { FileActionLinks } from "@/components/shared/file-action-links";
import { FileUploadInput } from "@/components/portal/file-upload-input";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import { MAX_UPLOAD_SIZE_LABEL } from "@/lib/storage/upload-limits";
import { cn } from "@/lib/utils";

export type PortalDocumentItem = {
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

const documentToneByStatus: Record<PortalDocumentItem["status"], {
  badge: StatusBadgeProps["variant"];
  label: string;
  cardClass: string;
  helperTone: "calm" | "review" | "action" | "warning" | "error";
}> = {
  MISSING: {
    badge: "warning",
    label: "مطلوب",
    cardClass: "border-warning-100 bg-warning-100/40",
    helperTone: "warning",
  },
  REJECTED: {
    badge: "error",
    label: "مرفوض",
    cardClass: "border-error-100 bg-error-100/40",
    helperTone: "error",
  },
  REUPLOAD_REQUESTED: {
    badge: "warning",
    label: "إعادة رفع",
    cardClass: "border-warning-100 bg-warning-100/40",
    helperTone: "warning",
  },
  UPLOADED: {
    badge: "waiting",
    label: "بانتظار المراجعة",
    cardClass: "border-secondary-100 bg-secondary-100/40",
    helperTone: "review",
  },
  UNDER_REVIEW: {
    badge: "waiting",
    label: "قيد المراجعة",
    cardClass: "border-secondary-100 bg-secondary-100/40",
    helperTone: "review",
  },
  APPROVED: {
    badge: "complete",
    label: "معتمد",
    cardClass: "border-success-100 bg-bg-surface",
    helperTone: "calm",
  },
};

function categoryLabel(category: DocumentCategory) {
  if (category === "STUDENT") return "مستند الطالب";
  if (category === "PARENT") return "مستند ولي الأمر";
  return "مستند الوصاية";
}

function statusExplanation(item: PortalDocumentItem) {
  if (item.status === "MISSING") {
    return "هذا المستند ما زال مطلوبًا لاستكمال الطلب.";
  }

  if (item.status === "REJECTED") {
    return "هذا المستند يحتاج إعادة رفع بعد ملاحظة الإدارة.";
  }

  if (item.status === "REUPLOAD_REQUESTED") {
    return "يرجى رفع نسخة محدثة من هذا المستند حسب توجيه الإدارة.";
  }

  if (item.status === "UPLOADED") {
    return "تم رفع هذا المستند وهو الآن بانتظار مراجعة الإدارة.";
  }

  if (item.status === "UNDER_REVIEW") {
    return "هذا المستند قيد المراجعة حالياً ولا يحتاج إجراء منك الآن.";
  }

  return "هذا المستند معتمد حالياً.";
}

export function DocumentItemCard({ item, isDev }: { item: PortalDocumentItem; isDev?: boolean }) {
  const canShowUploadForm =
    item.canUpload &&
    item.actionLabel &&
    (item.status === "MISSING" || item.status === "REJECTED" || item.status === "REUPLOAD_REQUESTED");
  const tone = documentToneByStatus[item.status];
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
    <BaseCard variant="outlined" className={cn("overflow-hidden", tone.cardClass)}>
      <BaseCardBody className="space-y-4">
        <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-h3 font-extrabold text-text-primary">{item.titleAr}</h3>
              <StatusBadge label={tone.label} variant={tone.badge} />
            </div>
            <p className="mt-2 text-body leading-7 text-text-secondary">
              {item.descriptionAr ?? "لا يوجد وصف إضافي لهذا المستند."}
            </p>
            <HelperText tone={tone.helperTone} className="mt-2">
              {statusExplanation(item)}
            </HelperText>
          </div>
          <StatusBadge label={categoryLabel(item.category)} variant="info" />
        </div>

        {item.adminNote ? (
          <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-3">
            <div className="text-caption font-bold text-text-muted">
              {item.status === "REJECTED"
                ? "سبب الرفض"
                : item.status === "REUPLOAD_REQUESTED"
                  ? "سبب طلب إعادة الرفع"
                  : "ملاحظة الإدارة"}
            </div>
            <p className="mt-1 text-body leading-7 text-text-primary">{item.adminNote}</p>
          </div>
        ) : null}

        <div className="grid gap-4 tablet:grid-cols-[1fr_auto] tablet:items-end">
          <div className="space-y-2">
            {item.fileAssetId ? (
              <FileActionLinks
                fileAssetId={item.fileAssetId}
                mimeType={item.fileMimeType}
                className="inline-flex rounded-badge bg-bg-surface px-3 py-2 text-caption font-bold text-pine disabled:cursor-wait disabled:opacity-60"
              />
            ) : (
              <HelperText>لم يتم رفع ملف لهذا المستند بعد.</HelperText>
            )}
          </div>

          {canShowUploadForm ? (
            <form
              className="flex flex-col gap-3 tablet:flex-row tablet:items-end"
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
                className="max-w-[220px] text-xs text-text-secondary file:mx-2 file:rounded-badge file:border-0 file:bg-bg-surface file:px-3 file:py-2 file:text-xs file:font-bold file:text-pine"
              />
              <Button
                type="submit"
                isLoading={isPending}
                disabled={isPending}
                title={isDev ? `${item.actionLabel} - متاح في التطوير` : item.actionLabel ?? undefined}
              >
                {isPending ? "جارٍ الرفع..." : item.actionLabel}
              </Button>
            </form>
          ) : (
            <HelperText>
              {item.status === "APPROVED"
                ? "لا يوجد إجراء مطلوب."
                : item.status === "UPLOADED" || item.status === "UNDER_REVIEW"
                  ? "هذا المستند للعرض فقط أثناء المراجعة."
                  : "لا يمكن الرفع من هذا الحساب."}
            </HelperText>
          )}
        </div>
      </BaseCardBody>
    </BaseCard>
  );
}
