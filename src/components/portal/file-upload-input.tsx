"use client";

import { useId, useState } from "react";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage/upload-limits";

export function FileUploadInput({
  name,
  label,
  helperText = "الحد الأقصى لحجم الملف: 5MB",
  className,
}: {
  name: string;
  label: string;
  helperText?: string;
  className?: string;
}) {
  const helperId = useId();
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink">{label}</span>
      <input
        type="file"
        name={name}
        required
        aria-describedby={`${helperId} ${error ? errorId : ""}`.trim()}
        className={
          className ??
          "max-w-[260px] text-xs text-ink/70 file:ml-2 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-pine"
        }
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];

          if (file && file.size > MAX_UPLOAD_SIZE_BYTES) {
            const message = "حجم الملف أكبر من الحد المسموح (5MB)";
            input.setCustomValidity(message);
            setError(message);
            input.reportValidity();
            return;
          }

          input.setCustomValidity("");
          setError(null);
        }}
      />
      <span id={helperId} className="mt-1 block text-xs text-ink/45">
        {helperText}
      </span>
      {error ? (
        <span id={errorId} className="mt-1 block text-xs font-medium text-[#a03232]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
