"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { AdminWorkspaceDocumentGroup } from "@/types/admin";
import { AdminDocumentStatusBadge } from "@/components/admin/admin-document-status-badge";
import { isPreviewableMimeType } from "@/lib/storage/file-preview";

type ReviewAction = (formData: FormData) => Promise<void>;

function ReviewSubmitButton({
  value,
  children,
  tone = "secondary",
  disabled,
}: {
  value: string;
  children: string;
  tone?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const className =
    tone === "primary"
      ? "rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      : "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink disabled:cursor-wait disabled:opacity-60";

  return (
    <button
      type="submit"
      name="status"
      value={value}
      disabled={disabled || pending}
      className={className}
    >
      {pending ? "جاري التنفيذ..." : children}
    </button>
  );
}

export function AdminDocumentReviewPanel({
  applicationId,
  groups,
  bulkAction,
  reviewAction,
}: {
  applicationId: string;
  groups: AdminWorkspaceDocumentGroup[];
  bulkAction: ReviewAction;
  reviewAction: ReviewAction;
}) {
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const selectableIds = useMemo(
    () =>
      groups.flatMap((group) =>
        group.items.filter((item) => item.canReview).map((item) => item.id),
      ),
    [groups],
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

  return (
    <div className="mt-5 space-y-5">
      <form action={bulkAction} className="rounded-2xl bg-sand p-4">
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
            >
              اعتماد الكل
            </ReviewSubmitButton>
            <ReviewSubmitButton value="REJECTED" disabled={selectedDocumentIds.length === 0}>
              رفض الكل
            </ReviewSubmitButton>
            <ReviewSubmitButton value="REUPLOAD_REQUESTED" disabled={selectedDocumentIds.length === 0}>
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

      {groups.map((group) => (
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
                        {isPreviewableMimeType(item.fileMimeType) ? (
                          <Link
                            href={`/api/files/${item.fileAssetId}/view`}
                            target="_blank"
                            className="inline-flex text-sm font-semibold text-pine"
                          >
                            عرض
                          </Link>
                        ) : null}
                        <Link
                          href={`/api/files/${item.fileAssetId}/download`}
                          className="inline-flex text-sm font-semibold text-pine"
                        >
                          تحميل
                        </Link>
                      </div>
                    ) : null}
                    {item.adminNote ? (
                      <div className="rounded-2xl bg-white px-3 py-3 text-sm text-ink/75">
                        ملاحظة الإدارة: {item.adminNote}
                      </div>
                    ) : null}
                  </div>
                  <form action={reviewAction} className="flex flex-col gap-2 md:min-w-[220px]">
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
                        <ReviewSubmitButton value="APPROVED" tone="primary">
                          اعتماد المستند
                        </ReviewSubmitButton>
                        <ReviewSubmitButton value="REJECTED">
                          رفض المستند
                        </ReviewSubmitButton>
                        <ReviewSubmitButton value="REUPLOAD_REQUESTED">
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
