import Link from "next/link";
import clsx from "clsx";
import type { PortalActionView } from "@/types/portal";

const tones = {
  critical: "border-[#d98662] bg-[#fff1ea] text-[#8d3a14]",
  warning: "border-[#e6c16d] bg-[#fff8e1] text-[#7a5a03]",
  neutral: "border-[#d7dfdb] bg-[#f7fbf9] text-[#21443c]",
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
