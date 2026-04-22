"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import type { AdminWorkspaceDocumentGroup } from "@/types/admin";
import { AdminDocumentStatusBadge } from "@/components/admin/admin-document-status-badge";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { FileActionLinks } from "@/components/shared/file-action-links";

type ReviewStatus = "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
type PendingAction = string;

const reviewSuccessMessages: Record<ReviewStatus, string> = {
  APPROVED: "تم اعتماد المستند",
  REJECTED: "تم رفض المستند",
  REUPLOAD_REQUESTED: "تم طلب إعادة الرفع",
};

function ReviewSubmitButton({
  value,
  children,
  tone = "secondary",
  disabled,
  pendingActions,
  actionKey,
}: {
  value: ReviewStatus;
  children: string;
  tone?: "primary" | "secondary";
  disabled?: boolean;
  pendingActions: PendingAction[];
  actionKey: string;
}) {
  const isCurrentAction = pendingActions.includes(actionKey);
  const actionGroup = actionKey.split(":").slice(0, -1).join(":");
  const isActionGroupPending = pendingActions.some(
    (pendingAction) => pendingAction.split(":").slice(0, -1).join(":") === actionGroup,
  );
  const className =
    tone === "primary"
      ? "rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      : "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink disabled:cursor-wait disabled:opacity-60";

  return (
    <button
      type="submit"
      name="status"
      value={value}
      disabled={disabled || isActionGroupPending}
      className={className}
    >
      {isCurrentAction ? "جاري التنفيذ..." : children}
    </button>
  );
}

function messageForReviewError(code?: string) {
  if (code === "missing_review_note") {
    return "يرجى كتابة ملاحظة عند الرفض أو طلب إعادة الرفع.";
  }

  if (code === "invalid_document_review") {
    return "تعذر تحديث حالة المستند المطلوب.";
  }

  return code || "تعذر تنفيذ الإجراء حالياً.";
}

export function AdminDocumentReviewPanel({
  applicationId,
  groups,
}: {
  applicationId: string;
  groups: AdminWorkspaceDocumentGroup[];
}) {
  const [currentGroups, setCurrentGroups] = useState(groups);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const inFlightActions = useRef(new Set<string>());

  const selectableIds = useMemo(
    () =>
      currentGroups.flatMap((group) =>
        group.items.filter((item) => item.canReview).map((item) => item.id),
      ),
    [currentGroups],
  );

  const allSelected = selectableIds.length > 0 && selectedDocumentIds.length === selectableIds.length;

  function toggleDocument(documentId: string) {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  }

  function toggleAll() {
    setSelectedDocumentIds(allSelected ? [] : selectableIds);
  }

  function updateDocumentsInState(
    documents: Array<{ id?: string; requirementId?: string; status: string; adminNote: string | null }>,
  ) {
    const updates = new Map(
      documents.flatMap((document) => {
        const entries: Array<[string, typeof document]> = [];
        if (document.id) entries.push([document.id, document]);
        if (document.requirementId) entries.push([document.requirementId, document]);
        return entries;
      }),
    );

    setCurrentGroups((current) =>
      current.map((group) => ({
        ...group,
        items: group.items.map((item) => {
          const update = updates.get(item.id) ?? updates.get(item.requirementId);
          if (!update) {
            return item;
          }

          return {
            ...item,
            status: update.status as typeof item.status,
            adminNote: update.adminNote,
          };
        }),
      })),
    );
  }

  async function submitReview(form: HTMLFormElement, status: ReviewStatus, actionKey: string) {
    const actionGroup = actionKey.split(":").slice(0, -1).join(":");
    const hasActionGroupInFlight = Array.from(inFlightActions.current).some(
      (pendingAction) => pendingAction.split(":").slice(0, -1).join(":") === actionGroup,
    );

    if (hasActionGroupInFlight) {
      return;
    }

    inFlightActions.current.add(actionKey);
    setPendingActions((current) => [...current, actionKey]);
    setToast(null);

    const formData = new FormData(form);
    const documentIds = formData.getAll("documentIds").map(String).filter(Boolean);
    const requirementId = String(formData.get("requirementId") ?? "");
    const adminNote = String(formData.get("adminNote") ?? "");

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/documents/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirementId: requirementId || undefined,
          documentIds,
          status,
          adminNote,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
        documents?: Array<{ id?: string; requirementId?: string; status: string; adminNote: string | null }>;
      } | null;

      if (!response.ok) {
        setToast({ tone: "error", message: messageForReviewError(payload?.error) });
        return;
      }

      updateDocumentsInState(payload?.documents ?? []);
      setToast({
        tone: "success",
        message: payload?.message ?? reviewSuccessMessages[status],
      });

      if (documentIds.length > 0) {
        setSelectedDocumentIds([]);
      }
    } catch {
      setToast({ tone: "error", message: "تعذر تنفيذ الإجراء حالياً." });
    } finally {
      inFlightActions.current.delete(actionKey);
      setPendingActions((current) => current.filter((item) => item !== actionKey));
    }
  }

  function handleReviewSubmit(event: FormEvent<HTMLFormElement>, actionPrefix: string) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.value as ReviewStatus | undefined;

    if (!status) {
      return;
    }

    submitReview(event.currentTarget, status, `${actionPrefix}:${status}`);
  }

  return (
    <div className="mt-5 space-y-5">
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <form
        onSubmit={(event) => handleReviewSubmit(event, "bulk")}
        className="rounded-2xl bg-sand p-4"
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        {selectedDocumentIds.map((documentId) => (
          <input key={documentId} type="hidden" name="documentIds" value={documentId} />
        ))}
        <div className="grid gap-3 lg:grid-cols-[1fr,1fr,auto]">
          <textarea
            name="adminNote"
            rows={3}
            placeholder="ملاحظة موحدة عند الرفض أو طلب إعادة الرفع الجماعي"
            className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
          />
          <div className="grid gap-2">
            <ReviewSubmitButton
              value="APPROVED"
              disabled={selectedDocumentIds.length === 0}
              tone="primary"
              pendingActions={pendingActions}
              actionKey="bulk:APPROVED"
            >
              اعتماد الكل
            </ReviewSubmitButton>
            <ReviewSubmitButton
              value="REJECTED"
              disabled={selectedDocumentIds.length === 0}
              pendingActions={pendingActions}
              actionKey="bulk:REJECTED"
            >
              رفض الكل
            </ReviewSubmitButton>
            <ReviewSubmitButton
              value="REUPLOAD_REQUESTED"
              disabled={selectedDocumentIds.length === 0}
              pendingActions={pendingActions}
              actionKey="bulk:REUPLOAD_REQUESTED"
            >
              طلب إعادة رفع
            </ReviewSubmitButton>
          </div>
          <div className="space-y-2 text-sm text-ink/60">
            <button
              type="button"
              onClick={toggleAll}
              disabled={selectableIds.length === 0}
              className="inline-flex rounded-full bg-white px-3 py-2 font-semibold text-pine disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allSelected ? "إلغاء تحديد الكل" : "تحديد كل القابل للمراجعة"}
            </button>
            <div>المحدد حالياً: {selectedDocumentIds.length}</div>
            <div>
              اختر المستندات من مربعات الاختيار داخل القائمة ثم استخدم هذا النموذج لتنفيذ
              الإجراء الجماعي.
            </div>
          </div>
        </div>
      </form>

      {currentGroups.map((group) => (
        <div key={group.id} className="space-y-3">
          <h3 className="text-base font-bold text-ink">{group.title}</h3>
          <div className="space-y-3">
            {group.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-sand p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.canReview ? (
                        <input
                          type="checkbox"
                          checked={selectedDocumentIds.includes(item.id)}
                          onChange={() => toggleDocument(item.id)}
                          className="size-4 rounded border-black/20"
                        />
                      ) : null}
                      <div className="text-base font-bold text-ink">{item.title}</div>
                      <AdminDocumentStatusBadge status={item.status} />
                    </div>
                    {item.description ? (
                      <p className="text-sm leading-6 text-ink/65">{item.description}</p>
                    ) : null}
                    <div className="text-sm text-ink/55">المسموح بالرفع: {item.uploaderRolesLabel}</div>
                    <div className="text-sm text-ink/55">
                      تم الرفع بواسطة: {item.uploadedByLabel ?? "غير متوفر"}
                    </div>
                    {item.fileAssetId ? (
                      <div className="flex items-center gap-3">
                        <FileActionLinks fileAssetId={item.fileAssetId} mimeType={item.fileMimeType} />
                      </div>
                    ) : null}
                    {item.adminNote ? (
                      <div className="rounded-2xl bg-white px-3 py-3 text-sm text-ink/75">
                        ملاحظة الإدارة: {item.adminNote}
                      </div>
                    ) : null}
                  </div>
                  <form
                    onSubmit={(event) => handleReviewSubmit(event, `document:${item.id}`)}
                    className="flex flex-col gap-2 md:min-w-[220px]"
                  >
                    <input type="hidden" name="applicationId" value={applicationId} />
                    <input type="hidden" name="requirementId" value={item.requirementId} />
                    <input type="hidden" name="targetTab" value="documents" />
                    <textarea
                      name="adminNote"
                      rows={3}
                      defaultValue={item.adminNote ?? ""}
                      placeholder="ملاحظة إدارية عند الرفض أو طلب إعادة الرفع"
                      className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
                    />
                    {item.status === "MISSING" || !item.canReview ? (
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-ink/55">
                        لا يمكن مراجعة هذا المستند قبل رفعه.
                      </div>
                    ) : (
                      <>
                        <ReviewSubmitButton
                          value="APPROVED"
                          tone="primary"
                          disabled={item.status === "APPROVED"}
                          pendingActions={pendingActions}
                          actionKey={`document:${item.id}:APPROVED`}
                        >
                          اعتماد المستند
                        </ReviewSubmitButton>
                        <ReviewSubmitButton
                          value="REJECTED"
                          disabled={item.status === "REJECTED"}
                          pendingActions={pendingActions}
                          actionKey={`document:${item.id}:REJECTED`}
                        >
                          رفض المستند
                        </ReviewSubmitButton>
                        <ReviewSubmitButton
                          value="REUPLOAD_REQUESTED"
                          disabled={item.status === "REUPLOAD_REQUESTED"}
                          pendingActions={pendingActions}
                          actionKey={`document:${item.id}:REUPLOAD_REQUESTED`}
                        >
                          طلب إعادة رفع
                        </ReviewSubmitButton>
                      </>
                    )}
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
