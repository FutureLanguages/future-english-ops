import Link from "next/link";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export type ReassuranceCardProps = {
  tone: "calm" | "action" | "review" | "warning";
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  badge?: {
    label: string;
  };
};

const toneStyles: Record<ReassuranceCardProps["tone"], {
  card: string;
  accent: string;
  badge: StatusBadgeProps["variant"];
  helper: "calm" | "action" | "review" | "warning";
}> = {
  calm: {
    card: "border-secondary-100 bg-secondary-100/70",
    accent: "bg-bg-surface text-pine",
    badge: "complete",
    helper: "calm",
  },
  action: {
    card: "border-primary-200 bg-bg-surface",
    accent: "bg-primary-200 text-primary-600",
    badge: "action",
    helper: "action",
  },
  review: {
    card: "border-secondary-100 bg-secondary-100/70",
    accent: "bg-info-100 text-info-500",
    badge: "waiting",
    helper: "review",
  },
  warning: {
    card: "border-warning-100 bg-warning-100/70",
    accent: "bg-warning-100 text-warning-500",
    badge: "warning",
    helper: "warning",
  },
};

export function ReassuranceCard({ badge, description, primaryAction, title, tone }: ReassuranceCardProps) {
  const styles = toneStyles[tone];
  const noActionHelper =
    tone === "review"
      ? "سنظهر أي تحديث من الإدارة هنا عند توفره."
      : "لا يلزمك اتخاذ إجراء الآن.";

  return (
    <BaseCard variant="outlined" className={cn("overflow-hidden", styles.card)}>
      <BaseCardBody className="flex flex-col gap-5 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-h3 font-black", styles.accent)}
            aria-hidden="true"
          >
            {tone === "calm" ? "✓" : tone === "review" ? "…" : "!"}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h2 font-extrabold text-text-primary">{title}</h2>
              {badge ? <StatusBadge label={badge.label} variant={styles.badge} /> : null}
            </div>
            <p className="mt-2 max-w-3xl text-body leading-7 text-text-secondary">{description}</p>
            {!primaryAction ? (
              <HelperText tone={styles.helper} className="mt-3">
                {noActionHelper}
              </HelperText>
            ) : null}
          </div>
        </div>
        {primaryAction ? (
          <Button asChild variant={tone === "action" || tone === "warning" ? "primary" : "secondary"} size="md">
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
        ) : null}
      </BaseCardBody>
    </BaseCard>
  );
}
