"use client";

import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  inputClassName?: string;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      className,
      disabled,
      errorText,
      helperText,
      id,
      inputClassName,
      label,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorId = errorText ? `${inputId}-error` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("w-full space-y-2 text-start", className)}>
        {label ? (
          <label htmlFor={inputId} className="block text-body font-bold text-text-primary">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            [
              "w-full rounded-input border bg-bg-surface px-4 py-3 text-body text-text-primary shadow-none",
              "placeholder:text-text-muted",
              "outline-none focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-border-focus/25",
              "transition-[color,background-color,border-color,box-shadow,opacity] duration-default ease-default",
              "disabled:cursor-not-allowed disabled:bg-bg-surface-alt disabled:text-text-muted disabled:opacity-70",
              errorText ? "border-error-600 bg-error-100/40" : "border-border-subtle hover:border-border-strong",
            ],
            inputClassName,
          )}
          {...props}
        />
        {errorText ? (
          <p id={errorId} className="text-helper font-semibold text-error-600">
            {errorText}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-helper text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";
