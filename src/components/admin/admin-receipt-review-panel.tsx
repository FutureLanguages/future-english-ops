"use client";

import { useRef, useState, type FormEvent } from "react";
import { AdminDocumentStatusBadge } from "@/components/admin/admin-document-status-badge";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { FileActionLinks } from "@/components/shared/file-action-links";

type ReceiptStatus = "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
type ReviewStatus = "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";

type ReceiptItem = {
  id: string;
  status: ReceiptStatus;
  adminNote: string | null;
  fileAssetId: string;
  fileMimeType: string;
  uploadedByLabel: string | null;
  createdAt: Date;
};

const reviewSuccessMessages: Record<ReviewStatus, string> = {
  APPROVED: "تم اعتماد الإيصال",
  REJECTED: "تم رفض الإيصال",
  REUPLOAD_REQUESTED: "تم طلب إعادة رفع الإيصال",
};

function messageForError(code?: string) {
  if (code === "missing_review_note") {
    return "يرجى كتابة ملاحظة عند الرفض أو طلب إعادة الرفع.";
  }

  if (code === "invalid_receipt_review") {
    return "تعذر تحديث حالة الإيصال المطلوب.";
  }

  return code || "تعذر تنفيذ إجراء الإيصال حالياً.";
}

function ReceiptReviewButton({
  status,
  children,
  receiptId,
  tone = "secondary",
  disabled,
  pendingActions,
}: {
  status: ReviewStatus;
  children: string;
  receiptId: string;
  tone?: "primary" | "secondary";
  disabled?: boolean;
  pendingActions: string[];
}) {
  const actionKey = `receipt:${receiptId}:${status}`;
  const actionGroup = `receipt:${receiptId}`;
  const isCurrentAction = pendingActions.includes(actionKey);
  const isActionGroupPending = pendingActions.some((pendingAction) => pendingAction.startsWith(actionGroup));
  const className =
    tone === "primary"
      ? "rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      : "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink disabled:cursor-wait disabled:opacity-60";

  return (
    <button
      type="submit"
      name="status"
      value={status}
      disabled={disabled || isActionGroupPending}
      className={className}
    >
      {isCurrentAction ? "جاري التنفيذ..." : children}
    </button>
  );
}

export function AdminReceiptReviewPanel({
  applicationId,
  receipts,
}: {
  applicationId: string;
  receipts: ReceiptItem[];
}) {
  const [receiptItems, setReceiptItems] = useState(receipts);
  const [pendingActions, setPendingActions] = useState<string[]>([]);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const inFlightActions = useRef(new Set<string>());

  async function submitReview(form: HTMLFormElement, receiptId: string, status: ReviewStatus) {
    const actionKey = `receipt:${receiptId}:${status}`;
    const actionGroup = `receipt:${receiptId}`;
    const hasActionGroupInFlight = Array.from(inFlightActions.current).some((pendingAction) =>
      pendingAction.startsWith(actionGroup),
    );

    if (hasActionGroupInFlight) {
      return;
    }

    inFlightActions.current.add(actionKey);
    setPendingActions((current) => [...current, actionKey]);
    setToast(null);

    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/receipts/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiptId,
          status,
          adminNote: String(formData.get("adminNote") ?? ""),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
        receipt?: {
          id: string;
          status: ReceiptStatus;
          adminNote: string | null;
        };
      } | null;

      if (!response.ok) {
        setToast({ tone: "error", message: messageForError(payload?.error) });
        return;
      }

      if (payload?.receipt) {
        setReceiptItems((current) =>
          current.map((receipt) =>
            receipt.id === payload.receipt!.id
              ? {
                  ...receipt,
                  status: payload.receipt!.status,
                  adminNote: payload.receipt!.adminNote,
                }
              : receipt,
          ),
        );
      }

      setToast({ tone: "success", message: payload?.message ?? reviewSuccessMessages[status] });
    } catch {
      setToast({ tone: "error", message: "تعذر تنفيذ إجراء الإيصال حالياً." });
    } finally {
      inFlightActions.current.delete(actionKey);
      setPendingActions((current) => current.filter((item) => item !== actionKey));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>, receiptId: string) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.value as ReviewStatus | undefined;

    if (!status) {
      return;
    }

    submitReview(event.currentTarget, receiptId, status);
  }

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      {receiptItems.length > 0 ? (
        receiptItems.map((receipt) => (
          <div key={receipt.id} className="rounded-2xl bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-ink">
                  {new Intl.DateTimeFormat("ar-SA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }).format(new Date(receipt.createdAt))}
                </div>
                <div className="mt-1 text-xs text-ink/55">
                  {receipt.uploadedByLabel ?? "رافع غير معروف"}
                </div>
              </div>
              <AdminDocumentStatusBadge status={receipt.status} />
            </div>
            {receipt.adminNote ? (
              <div className="mt-3 rounded-2xl bg-sand px-3 py-3 text-sm text-ink/80">
                {receipt.adminNote}
              </div>
            ) : null}
            <div className="mt-3 flex items-center gap-3">
              <FileActionLinks fileAssetId={receipt.fileAssetId} mimeType={receipt.fileMimeType} />
            </div>
            <form onSubmit={(event) => handleSubmit(event, receipt.id)} className="mt-3 flex flex-col gap-2">
              <textarea
                name="adminNote"
                rows={3}
                defaultValue={receipt.adminNote ?? ""}
                placeholder="ملاحظة مرتبطة بالإيصال"
                className="rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
              />
              <ReceiptReviewButton
                receiptId={receipt.id}
                status="APPROVED"
                tone="primary"
                disabled={receipt.status === "APPROVED"}
                pendingActions={pendingActions}
              >
                اعتماد الإيصال
              </ReceiptReviewButton>
              <ReceiptReviewButton
                receiptId={receipt.id}
                status="REJECTED"
                disabled={receipt.status === "REJECTED"}
                pendingActions={pendingActions}
              >
                رفض الإيصال
              </ReceiptReviewButton>
              <ReceiptReviewButton
                receiptId={receipt.id}
                status="REUPLOAD_REQUESTED"
                disabled={receipt.status === "REUPLOAD_REQUESTED"}
                pendingActions={pendingActions}
              >
                طلب إعادة رفع
              </ReceiptReviewButton>
            </form>
          </div>
        ))
      ) : (
        <div className="rounded-2xl bg-white px-4 py-4 text-sm text-ink/55">
          لا توجد إيصالات مرفوعة حتى الآن.
        </div>
      )}
    </div>
  );
}
