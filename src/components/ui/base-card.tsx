import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const baseCardVariants = cva(
  "rounded-card bg-bg-surface text-text-primary transition-[background-color,border-color,box-shadow] duration-default ease-default",
  {
    variants: {
      variant: {
        outlined: "border border-border-subtle shadow-none",
        elevated: "border border-transparent shadow-card hover:shadow-card-hover",
      },
    },
    defaultVariants: {
      variant: "outlined",
    },
  },
);

export type BaseCardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof baseCardVariants>;

export const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(baseCardVariants({ variant }), className)} {...props} />
  ),
);

BaseCard.displayName = "BaseCard";

export const BaseCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border-b border-border-subtle px-4 py-4 tablet:px-5", className)} {...props} />
  ),
);

BaseCardHeader.displayName = "BaseCardHeader";

export const BaseCardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-4 py-4 tablet:px-5 tablet:py-5", className)} {...props} />
  ),
);

BaseCardBody.displayName = "BaseCardBody";

export const BaseCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border-t border-border-subtle px-4 py-4 tablet:px-5", className)} {...props} />
  ),
);

BaseCardFooter.displayName = "BaseCardFooter";

export { baseCardVariants };
