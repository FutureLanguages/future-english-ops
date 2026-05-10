import Link from "next/link";
import type { ReactNode } from "react";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";

export type EmptyStateProps = {
  title: string;
  description: string;
  helperText?: string;
  cta?: {
    label: string;
    href?: string;
  };
  icon?: ReactNode;
};

export function EmptyState({ cta, description, helperText, icon, title }: EmptyStateProps) {
  return (
    <BaseCard variant="outlined">
      <BaseCardBody className="flex flex-col items-start gap-3">
        {icon ? <div className="text-pine" aria-hidden="true">{icon}</div> : null}
        <div>
          <h3 className="text-h3 font-extrabold text-text-primary">{title}</h3>
          <p className="mt-2 text-body leading-7 text-text-secondary">{description}</p>
        </div>
        {helperText ? <HelperText>{helperText}</HelperText> : null}
        {cta?.href ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : null}
      </BaseCardBody>
    </BaseCard>
  );
}
