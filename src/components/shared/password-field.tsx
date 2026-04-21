"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

type PasswordFieldProps = {
  id?: string;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  helperText?: string;
  className?: string;
  onValueChange?: (value: string) => void;
};

export function PasswordField({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  required,
  helperText,
  className,
  onValueChange,
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          onChange={(event) => onValueChange?.(event.currentTarget.value)}
          className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 pl-12 text-sm outline-none focus:border-pine"
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 left-3 inline-flex items-center justify-center text-ink/55 transition hover:text-pine"
          aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          title={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {helperText ? <p className="mt-1 text-xs text-ink/55">{helperText}</p> : null}
    </label>
  );
}
