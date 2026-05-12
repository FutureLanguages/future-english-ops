"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { FileActionLinks } from "@/components/shared/file-action-links";
import { FileUploadInput } from "@/components/portal/file-upload-input";
import { BaseCard, BaseCardBody, BaseCardHeader } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import { MAX_UPLOAD_SIZE_LABEL } from "@/lib/storage/upload-limits";
import { cn } from "@/lib/utils";

type ReceiptStatus = "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";

type ReceiptItem = {
  id: string;
  status: ReceiptStatus;
  statusLabel: string;
  adminNote: string | null;
  fileAssetId: string;
  fileMimeType: string;
  createdAt: Date;
};

type PaymentReceiptCardProps = {
  applicationId: string;
  latestPaymentNote: string | null;
  canUploadReceipt: boolean;
  receipts: ReceiptItem[];
  remainingAmountSar: number;
  role: "STUDENT" | "PARENT";
  isDev?: boolean;
};

const receiptToneByStatus: Record<ReceiptStatus, {
  badge: StatusBadgeProps["variant"];
  label: string;
  cardClass: string;
  helperTone: "calm" | "review" | "warning" | "error";
}> = {
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

function formatSar(value: number) {
  return `${value.toLocaleString("en-US")} ر.س`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function receiptExplanation(receipt: ReceiptItem) {
  if (receipt.status === "REJECTED") {
    return "هذا الإيصال يحتاج تصحيحاً بعد ملاحظة الإدارة.";
  }

  if (receipt.status === "REUPLOAD_REQUESTED") {
    return "يرجى رفع إيصال محدث حسب توجيه الإدارة.";
  }

  if (receipt.status === "UPLOADED") {
    return "تم رفع هذا الإيصال وهو الآن بانتظار مراجعة الإدارة.";
  }

  if (receipt.status === "UNDER_REVIEW") {
    return "هذا الإيصال قيد المراجعة حالياً ولا يحتاج إجراء منك الآن.";
  }

  return "هذا الإيصال معتمد حالياً.";
}

function groupReceipts(receipts: ReceiptItem[]) {
  const sortedReceipts = receipts.slice().sort((left, right) => {
    const priority: Record<ReceiptStatus, number> = {
      REJECTED: 1,
      REUPLOAD_REQUESTED: 2,
      UPLOADED: 3,
      UNDER_REVIEW: 4,
      APPROVED: 5,
    };

    if (priority[left.status] !== priority[right.status]) {
      return priority[left.status] - priority[right.status];
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  return {
    needsAction: sortedReceipts.filter((receipt) => receipt.status === "REJECTED" || receipt.status === "REUPLOAD_REQUESTED"),
    underReview: sortedReceipts.filter((receipt) => receipt.status === "UPLOADED" || receipt.status === "UNDER_REVIEW"),
    approved: sortedReceipts.filter((receipt) => receipt.status === "APPROVED"),
  };
}

export function PaymentReceiptCard({
  applicationId,
  canUploadReceipt,
  isDev,
  latestPaymentNote,
  receipts,
  remainingAmountSar,
  role,
}: PaymentReceiptCardProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const groupedReceipts = groupReceipts(receipts);
  const hasReceiptAction = groupedReceipts.needsAction.length > 0;
  const shouldShowUploadForm = canUploadReceipt && (remainingAmountSar > 0 || hasReceiptAction);

  function messageForError(code?: string) {
    if (code === "missing_file") return "يرجى اختيار ملف الإيصال قبل الإرسال.";
    if (code === "file_too_large") return `حجم الملف أكبر من الحد المسموح (${MAX_UPLOAD_SIZE_LABEL}).`;
    if (code === "unsupported_file_type") return "نوع الملف غير مدعوم. يرجى رفع PDF أو صورة.";
    if (code === "agreement_required") return "يجب الموافقة على الميثاق قبل استكمال البيانات.";
    return "تعذر تنفيذ عملية السداد المطلوبة حالياً.";
  }

  return (
    <div className="space-y-5">
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />

      <PaymentActionBlock
        canUploadReceipt={canUploadReceipt}
        hasReceiptAction={hasReceiptAction}
        isDev={isDev}
        isPending={isPending}
        latestPaymentNote={latestPaymentNote}
        remainingAmountSar={remainingAmountSar}
        role={role}
        shouldShowUploadForm={shouldShowUploadForm}
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
        applicationId={applicationId}
      />

      {groupedReceipts.needsAction.length > 0 ? (
        <ReceiptGroup
          title="إيصالات تحتاج إجراء"
          description="هذه الإيصالات تحتاج تصحيحاً أو إعادة رفع قبل اعتمادها."
          badge={{ label: "الأولوية الأعلى", variant: "warning" }}
          receipts={groupedReceipts.needsAction}
        />
      ) : null}

      {groupedReceipts.underReview.length > 0 ? (
        <ReceiptGroup
          title="إيصالات بانتظار المراجعة"
          description="تم رفع هذه الإيصالات وهي الآن لدى الإدارة للمراجعة."
          badge={{ label: "للمتابعة فقط", variant: "waiting" }}
          receipts={groupedReceipts.underReview}
        />
      ) : null}

      {groupedReceipts.approved.length > 0 ? (
        <ReceiptGroup
          title="إيصالات معتمدة"
          description="هذه الإيصالات تم اعتمادها أو تسجيلها ضمن متابعة السداد."
          badge={{ label: "معتمدة", variant: "complete" }}
          receipts={groupedReceipts.approved}
        />
      ) : null}

      {receipts.length === 0 && remainingAmountSar <= 0 ? (
        <EmptyState
          title="لا توجد إيصالات ظاهرة حالياً"
          description="لا توجد إيصالات مرفوعة في هذه الصفحة، ولا يوجد مبلغ متبقٍ حسب الملخص الحالي."
        />
      ) : null}
    </div>
  );
}

function PaymentActionBlock({
  applicationId,
  canUploadReceipt,
  hasReceiptAction,
  isDev,
  isPending,
  latestPaymentNote,
  onSubmit,
  remainingAmountSar,
  role,
  shouldShowUploadForm,
}: {
  applicationId: string;
  canUploadReceipt: boolean;
  hasReceiptAction: boolean;
  isDev?: boolean;
  isPending: boolean;
  latestPaymentNote: string | null;
  remainingAmountSar: number;
  role: "STUDENT" | "PARENT";
  shouldShowUploadForm: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const hasOutstandingPayment = remainingAmountSar > 0;
  const isActionNeeded = hasOutstandingPayment || hasReceiptAction;

  return (
    <BaseCard
      variant="outlined"
      className={cn(
        isActionNeeded ? "border-warning-100 bg-warning-100/40" : "border-secondary-100 bg-secondary-100/60",
      )}
    >
      <BaseCardHeader>
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div>
            <h2 className="text-h2 font-extrabold text-text-primary">
              {isActionNeeded ? "متابعة السداد المطلوبة" : "لا توجد مدفوعات تحتاج إجراء الآن"}
            </h2>
            <HelperText tone={isActionNeeded ? "warning" : "calm"}>
              {actionDescription({ canUploadReceipt, hasOutstandingPayment, hasReceiptAction, role })}
            </HelperText>
          </div>
          <StatusBadge
            label={isActionNeeded ? "يحتاج متابعة" : "للمتابعة فقط"}
            variant={isActionNeeded ? "warning" : "complete"}
          />
        </div>
      </BaseCardHeader>

      <BaseCardBody className="space-y-4">
        {hasOutstandingPayment ? (
          <div className="rounded-lg bg-bg-surface px-4 py-3">
            <div className="text-helper font-bold text-text-muted">المبلغ المتبقي</div>
            <div dir="ltr" className="mt-1 text-h2 font-black text-warning-500">
              {formatSar(remainingAmountSar)}
            </div>
          </div>
        ) : null}

        {latestPaymentNote ? (
          <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-3">
            <div className="text-caption font-bold text-text-muted">آخر ملاحظة مرتبطة بالسداد</div>
            <p className="mt-1 text-body leading-7 text-text-primary">{latestPaymentNote}</p>
          </div>
        ) : null}

        {shouldShowUploadForm ? (
          <form
            className="flex flex-col gap-3 rounded-lg bg-bg-surface p-4 tablet:flex-row tablet:items-end"
            onSubmit={onSubmit}
          >
            <input type="hidden" name="applicationId" value={applicationId} />
            <FileUploadInput
              name="file"
              label={hasReceiptAction ? "رفع إيصال مصحح" : "إضافة إيصال سداد"}
              className="max-w-[240px] text-xs text-text-secondary file:mx-2 file:rounded-badge file:border-0 file:bg-bg-surface-alt file:px-3 file:py-2 file:text-xs file:font-bold file:text-pine"
            />
            <Button
              type="submit"
              isLoading={isPending}
              disabled={isPending}
              title={isDev ? "رفع إيصال سداد - متاح في التطوير" : "رفع إيصال سداد"}
            >
              {isPending ? "جارٍ الرفع..." : hasReceiptAction ? "رفع إيصال مصحح" : "رفع إيصال سداد"}
            </Button>
          </form>
        ) : (
          <HelperText>
            {canUploadReceipt
              ? "لا حاجة لرفع إيصال جديد الآن."
              : "رفع الإيصالات غير متاح لهذا الحساب حالياً."}
          </HelperText>
        )}
      </BaseCardBody>
    </BaseCard>
  );
}

function actionDescription({
  canUploadReceipt,
  hasOutstandingPayment,
  hasReceiptAction,
  role,
}: {
  canUploadReceipt: boolean;
  hasOutstandingPayment: boolean;
  hasReceiptAction: boolean;
  role: "STUDENT" | "PARENT";
}) {
  if (hasReceiptAction && canUploadReceipt) {
    return "يوجد إيصال يحتاج تصحيحاً. يمكنك رفع إيصال محدث من هنا.";
  }

  if (hasReceiptAction) {
    return "يوجد إيصال يحتاج تصحيحاً، لكن الرفع غير متاح من هذا الحساب.";
  }

  if (hasOutstandingPayment && canUploadReceipt) {
    return "يوجد مبلغ متبقٍ يحتاج متابعة. يمكنك رفع إيصال السداد من هنا عند توفره.";
  }

  if (hasOutstandingPayment) {
    return role === "STUDENT"
      ? "يوجد مبلغ متبقٍ، وتتم متابعة السداد من حساب ولي الأمر أو عبر التنسيق المعتمد."
      : "يوجد مبلغ متبقٍ، لكن رفع الإيصالات غير متاح من هذا الحساب حالياً.";
  }

  return "لا يوجد إيصال يحتاج تصحيحاً أو مبلغ متبقٍ ظاهر في الملخص الحالي.";
}

function ReceiptGroup({
  badge,
  description,
  receipts,
  title,
}: {
  title: string;
  description: string;
  badge: { label: string; variant: StatusBadgeProps["variant"] };
  receipts: ReceiptItem[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-h2 font-extrabold text-text-primary">{title}</h2>
          <StatusBadge label={badge.label} variant={badge.variant} />
        </div>
        <p className="mt-2 text-body leading-7 text-text-secondary">{description}</p>
      </div>
      <div className="grid gap-4">
        {receipts.map((receipt) => (
          <ReceiptItemCard key={receipt.id} receipt={receipt} />
        ))}
      </div>
    </section>
  );
}

function ReceiptItemCard({ receipt }: { receipt: ReceiptItem }) {
  const tone = receiptToneByStatus[receipt.status];

  return (
    <BaseCard variant="outlined" className={cn("overflow-hidden", tone.cardClass)}>
      <BaseCardBody className="space-y-4">
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-h3 font-extrabold text-text-primary">إيصال بتاريخ {formatDate(receipt.createdAt)}</h3>
              <StatusBadge label={tone.label} variant={tone.badge} />
            </div>
            <HelperText tone={tone.helperTone} className="mt-2">
              {receiptExplanation(receipt)}
            </HelperText>
          </div>
          <StatusBadge label={receipt.statusLabel} variant="info" />
        </div>

        {receipt.adminNote ? (
          <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-3">
            <div className="text-caption font-bold text-text-muted">
              {receipt.status === "REJECTED"
                ? "سبب الرفض"
                : receipt.status === "REUPLOAD_REQUESTED"
                  ? "سبب طلب إعادة الرفع"
                  : "ملاحظة الإدارة"}
            </div>
            <p className="mt-1 text-body leading-7 text-text-primary">{receipt.adminNote}</p>
          </div>
        ) : null}

        <FileActionLinks
          fileAssetId={receipt.fileAssetId}
          mimeType={receipt.fileMimeType}
          className="inline-flex rounded-badge bg-bg-surface px-3 py-2 text-caption font-bold text-pine disabled:cursor-wait disabled:opacity-60"
          previewLabel="عرض الإيصال"
          downloadLabel="تحميل الإيصال"
        />
      </BaseCardBody>
    </BaseCard>
  );
}
