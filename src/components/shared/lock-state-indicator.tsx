import { Lock, LockOpen } from "lucide-react";

type LockStateIndicatorProps = {
  locked: boolean;
  label?: string;
  subtle?: boolean;
  title?: string;
};

export function LockStateIndicator({
  locked,
  label,
  subtle,
  title,
}: LockStateIndicatorProps) {
  return (
    <span
      title={title ?? (locked ? "هذا القسم مقفل" : "القسم متاح للتعديل")}
      aria-label={title ?? (locked ? "هذا القسم مقفل" : "القسم متاح للتعديل")}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        locked
          ? subtle
            ? "bg-pine/10 text-pine"
            : "bg-pine text-white"
          : subtle
            ? "bg-mist text-pine/70"
            : "bg-mist text-pine"
      }`}
    >
      {locked ? (
        <Lock aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      ) : (
        <LockOpen aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.1} />
      )}
      {label ? <span>{label}</span> : null}
    </span>
  );
}
