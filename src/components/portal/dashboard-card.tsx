import Link from "next/link";
import type { PortalSectionCard } from "@/types/portal";

export function DashboardSectionCard({ card }: { card: PortalSectionCard }) {
  const toneClasses =
    card.statusTone === "success"
      ? "bg-[#e9f7ee] text-[#1b7a43]"
      : card.statusTone === "warning"
        ? "bg-[#fff1ea] text-[#9f4a1f]"
        : "bg-mist text-pine";

  const content = (
    <div className="rounded-panel bg-white p-5 shadow-soft transition hover:-translate-y-0.5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-ink">{card.title}</h3>
          <p className="mt-1 text-sm leading-6 text-ink/65">{card.description}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses}`}>
          {card.statusLabel ?? "ملخص"}
        </span>
      </div>

      <div className={`grid gap-3 ${card.stats.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
        {card.stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-sand px-3 py-3">
            <div className="text-xs font-medium text-ink/55">{stat.label}</div>
            <div className="mt-1 text-base font-bold text-ink">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-mist px-4 py-3">
        <span className="text-sm text-ink/65">
          {card.statusTone === "success"
            ? "القسم واضح ومكتمل حالياً، ويمكنك فتحه للمراجعة فقط."
            : card.statusTone === "warning"
              ? "هذا القسم يحتاج متابعة الآن لإكمال الطلب."
              : "افتح هذا القسم عند الحاجة إلى التفاصيل أو الإجراء التالي."}
        </span>
        {card.href ? (
          <span className="text-sm font-semibold text-pine">{card.ctaLabel ?? "فتح القسم"}</span>
        ) : (
          <span className="text-sm font-semibold text-ink/45">{card.disabledLabel ?? "غير متاح حالياً"}</span>
        )}
      </div>
    </div>
  );

  if (card.href) {
    return <Link href={card.href}>{content}</Link>;
  }

  return content;
}
