"use client";

import { useState } from "react";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { isPreviewableMimeType } from "@/lib/storage/file-preview";

function filenameFromDisposition(disposition: string | null) {
  const encodedMatch = disposition?.match(/filename\*=UTF-8''([^;]+)/);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  return "file";
}

export function FileActionLinks({
  fileAssetId,
  mimeType,
  previewLabel = "عرض",
  downloadLabel = "تحميل",
  className = "inline-flex text-sm font-semibold text-pine",
  buttonClassName,
}: {
  fileAssetId: string;
  mimeType: string | null;
  previewLabel?: string;
  downloadLabel?: string;
  className?: string;
  buttonClassName?: string;
}) {
  const [pendingAction, setPendingAction] = useState<"view" | "download" | null>(null);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const canPreview = isPreviewableMimeType(mimeType);
  const actionClassName = buttonClassName ?? className;

  async function openFile(action: "view" | "download") {
    if (pendingAction) {
      return;
    }

    setPendingAction(action);
    setToast(null);

    try {
      const response = await fetch(`/api/files/${fileAssetId}/${action}`);

      if (response.status === 404) {
        setToast({ tone: "error", message: "الملف غير متوفر" });
        return;
      }

      if (!response.ok) {
        setToast({ tone: "error", message: "تعذر فتح الملف حالياً" });
        return;
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      if (action === "view") {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
        return;
      }

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filenameFromDisposition(response.headers.get("Content-Disposition"));
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      setToast({ tone: "error", message: "تعذر فتح الملف حالياً" });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <>
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      {canPreview ? (
        <button
          type="button"
          disabled={Boolean(pendingAction)}
          onClick={() => openFile("view")}
          className={actionClassName}
          title="عرض الملف داخل المتصفح"
        >
          {pendingAction === "view" ? "جاري الفتح..." : previewLabel}
        </button>
      ) : null}
      <button
        type="button"
        disabled={Boolean(pendingAction)}
        onClick={() => openFile("download")}
        className={actionClassName}
        title="تحميل الملف"
      >
        {pendingAction === "download" ? "جاري التحميل..." : downloadLabel}
      </button>
    </>
  );
}
