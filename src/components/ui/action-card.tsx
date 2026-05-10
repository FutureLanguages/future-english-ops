import Link from "next/link";
import type { ReactNode } from "react";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";

export type ActionCardProps = {
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  helperText?: string;
  badge?: Pick<StatusBadgeProps, "label" | "variant">;
  icon?: ReactNode;
};

export function ActionCard({ badge, description, helperText, icon, primaryAction, title }: ActionCardProps) {
  return (
    <BaseCard variant="elevated" className="border-primary-200 bg-bg-surface">
      <BaseCardBody className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between">
          <div className="flex min-w-0 gap-3">
            {icon ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-200 text-primary-600" aria-hidden="true">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-h2 font-extrabold text-text-primary">{title}</h2>
              <p className="mt-2 max-w-3xl text-body leading-7 text-text-secondary">{description}</p>
            </div>
          </div>
          {badge ? <StatusBadge label={badge.label} variant={badge.variant} /> : null}
        </div>
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
          {helperText ? <HelperText tone="action">{helperText}</HelperText> : <span />}
          {primaryAction ? (
            <Button asChild variant="primary" size="md">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
          ) : null}
        </div>
      </BaseCardBody>
    </BaseCard>
  );
}
