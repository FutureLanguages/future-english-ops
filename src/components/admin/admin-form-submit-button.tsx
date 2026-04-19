"use client";

import { useFormStatus } from "react-dom";

export function AdminFormSubmitButton({
  idleLabel,
  pendingLabel = "جارٍ الحفظ...",
  tone = "secondary",
}: {
  idleLabel: string;
  pendingLabel?: string;
  tone?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  const className =
    tone === "primary"
      ? "rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-80"
      : "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink disabled:cursor-wait disabled:opacity-80";

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
