"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 rounded-button font-bold",
    "outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface",
    "transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-default ease-default",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-55",
  ],
  {
    variants: {
      variant: {
        primary: "border border-primary-500 bg-primary-500 text-text-on-primary shadow-card hover:bg-primary-600 hover:border-primary-600",
        secondary: "border border-border-subtle bg-secondary-100 text-pine hover:border-secondary-600 hover:bg-secondary-500/30",
        ghost: "border border-transparent bg-transparent text-pine hover:bg-success-100",
      },
      size: {
        sm: "min-h-9 px-3 py-2 text-caption",
        md: "min-h-11 px-4 py-2.5 text-body",
        lg: "min-h-12 px-5 py-3 text-h3",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    loadingLabel?: string;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      asChild = false,
      children,
      disabled,
      endIcon,
      fullWidth,
      isLoading = false,
      loadingLabel = "جارٍ التنفيذ",
      size,
      startIcon,
      type = "button",
      variant,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;
    const child = asChild && isValidElement(children)
      ? children as ReactElement<{
          className?: string;
          children?: ReactNode;
          "aria-disabled"?: boolean;
          "aria-busy"?: boolean;
          onClick?: (event: MouseEvent<HTMLElement>) => void;
          tabIndex?: number;
        }>
      : null;
    const displayChildren = child ? child.props.children : children;
    const handleChildClick = (event: MouseEvent<HTMLElement>) => {
      if (isDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      child?.props.onClick?.(event);
    };
    const content = (
      <>
        <span className={cn("inline-flex items-center justify-center gap-2", isLoading && "opacity-0")}>
          {startIcon ? <span className="shrink-0" aria-hidden="true">{startIcon}</span> : null}
          <span>{displayChildren}</span>
          {endIcon ? <span className="shrink-0" aria-hidden="true">{endIcon}</span> : null}
        </span>
        {isLoading ? (
          <span className="absolute inline-flex items-center justify-center gap-2" role="status">
            <span className="h-4 w-4 animate-spin rounded-full border-strong border-current border-t-transparent" aria-hidden="true" />
            <span className="sr-only">{loadingLabel}</span>
          </span>
        ) : null}
      </>
    );

    if (child) {
      return cloneElement(child, {
        className: cn(
          buttonVariants({ variant, size, fullWidth }),
          isDisabled && "pointer-events-none opacity-55",
          child.props.className,
          className,
        ),
        "aria-disabled": isDisabled || undefined,
        "aria-busy": isLoading || undefined,
        onClick: handleChildClick,
        tabIndex: isDisabled ? -1 : child.props.tabIndex,
        children: content,
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
