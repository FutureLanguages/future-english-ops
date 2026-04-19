"use client";

import { Lock, LockOpen } from "lucide-react";
import { useFormStatus } from "react-dom";

export function AdminLockToggleButton({
  locked,
  title,
  disabled,
}: {
  locked: boolean;
  title: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      title={title || (locked ? "القسم مقفل" : "القسم متاح للتعديل")}
      aria-label={title || (locked ? "القسم مقفل" : "القسم متاح للتعديل")}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
        locked
          ? "border-pine bg-pine text-white hover:bg-pine/90"
          : "border-pine/15 bg-mist text-pine/70 hover:bg-mist/80 hover:text-pine"
      } ${isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"} shadow-sm`}
    >
      {pending ? (
        <span className="text-base leading-none">…</span>
      ) : locked ? (
        <Lock className="h-[18px] w-[18px]" strokeWidth={2.2} />
      ) : (
        <LockOpen className="h-[18px] w-[18px]" strokeWidth={2.1} />
      )}
    </button>
  );
}
