import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const helperTextVariants = cva("text-helper leading-6", {
  variants: {
    tone: {
      calm: "text-text-muted",
      review: "text-info-500",
      action: "text-primary-600",
      warning: "text-warning-500",
      error: "text-error-600",
    },
  },
  defaultVariants: {
    tone: "calm",
  },
});

export type HelperTextProps = HTMLAttributes<HTMLParagraphElement> & VariantProps<typeof helperTextVariants>;

export function HelperText({ className, tone, ...props }: HelperTextProps) {
  return <p className={cn(helperTextVariants({ tone }), className)} {...props} />;
}

export { helperTextVariants };
