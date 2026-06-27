import Link from "next/link";
import clsx from "clsx";
import type { PortalActionView } from "@/types/portal";

const tones = {
  critical: "border-brand/30 bg-primary-200/45 text-brand",
  warning: "border-warning-100 bg-warning-100 text-warning-500",
  neutral: "border-pine/15 bg-mist text-pine",
} as const;

export function RequiredActionsList({ actions }: { actions: PortalActionView[] }) {
  if (actions.length === 0) {
    return (
      <div className="rounded-panel border border-dashed border-pine/15 bg-white/70 p-5 text-sm text-ink/60">
        لا توجد إجراءات مطلوبة حالياً.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => {
        const content = (
          <div className={clsx("rounded-2xl border px-4 py-3 text-sm font-semibold", tones[action.tone])}>
            {action.label}
          </div>
        );

        if (action.href) {
          return (
            <Link key={action.id} href={action.href}>
              {content}
            </Link>
          );
        }

        return <div key={action.id}>{content}</div>;
      })}
    </div>
  );
}
