import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-badge px-3 py-1 text-caption font-bold leading-none",
  {
    variants: {
      variant: {
        complete: "bg-success-100 text-success-700",
        waiting: "bg-secondary-100 text-pine",
        action: "bg-primary-200 text-text-primary",
        warning: "bg-warning-100 text-warning-500",
        error: "bg-error-100 text-error-600",
        info: "bg-info-100 text-info-500",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

export type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  label: string;
  icon?: ReactNode;
  className?: string;
};

export function StatusBadge({ className, icon, label, variant }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {icon ? <span className="shrink-0" aria-hidden="true">{icon}</span> : null}
      <span>{label}</span>
    </span>
  );
}

export { statusBadgeVariants };
