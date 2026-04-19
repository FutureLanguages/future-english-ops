"use client";

import { Download } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

type DownloadableDocument = {
  requirementId: string;
  title: string;
  fileAssetId: string | null;
};

export function AdminBulkDownloadPanel({ items }: { items: DownloadableDocument[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const downloadableItems = useMemo(
    () => items.filter((item) => Boolean(item.fileAssetId)),
    [items],
  );

  function toggle(fileAssetId: string) {
    setSelectedIds((current) =>
      current.includes(fileAssetId)
        ? current.filter((item) => item !== fileAssetId)
        : [...current, fileAssetId],
    );
  }

  function downloadSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    startTransition(() => {
      const params = new URLSearchParams();

      for (const id of selectedIds) {
        params.append("fileAssetIds", id);
      }

      window.location.href = `/admin/documents/bulk-download?${params.toString()}`;
    });
  }

  if (downloadableItems.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-mist p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-bold text-ink">تحميل مستندات متعددة</h3>
          <p className="mt-1 text-sm text-ink/65">
            اختر المستندات المطلوبة ثم نزّلها في ملف ZIP واحد.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadSelected}
          disabled={selectedIds.length === 0 || isPending}
          className="inline-flex items-center gap-2 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          <span>{isPending ? "جارٍ تجهيز الملف..." : "تحميل المحدد"}</span>
        </button>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {downloadableItems.map((item) => (
          <label
            key={item.requirementId}
            className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 text-sm text-ink"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(item.fileAssetId!)}
              onChange={() => toggle(item.fileAssetId!)}
            />
            <span>{item.title}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
