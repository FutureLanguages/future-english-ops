import Link from "next/link";
import type { ReactNode } from "react";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export type SectionCardProps = {
  title: string;
  description: string;
  href?: string;
  ctaLabel?: string;
  icon?: ReactNode;
  badge?: Pick<StatusBadgeProps, "label" | "variant">;
  meta?: string;
  emphasized?: boolean;
  className?: string;
};

export function SectionCard({
  badge,
  className,
  ctaLabel,
  description,
  emphasized = false,
  href,
  icon,
  meta,
  title,
}: SectionCardProps) {
  return (
    <BaseCard
      variant={emphasized ? "elevated" : "outlined"}
      className={cn("h-full", emphasized && "border-primary-200", className)}
    >
      <BaseCardBody className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-100 text-pine" aria-hidden="true">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h3 className="text-h3 font-extrabold text-text-primary">{title}</h3>
              <p className="mt-2 text-body leading-7 text-text-secondary">{description}</p>
            </div>
          </div>
          {badge ? <StatusBadge label={badge.label} variant={badge.variant} /> : null}
        </div>
        <div className="mt-auto flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
          {meta ? <HelperText>{meta}</HelperText> : <span />}
          {href && ctaLabel ? (
            <Button asChild variant={emphasized ? "primary" : "secondary"} size="sm">
              <Link href={href}>{ctaLabel}</Link>
            </Button>
          ) : null}
        </div>
      </BaseCardBody>
    </BaseCard>
  );
}
