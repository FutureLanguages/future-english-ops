"use client";

import { useMemo, useState } from "react";

type ValidatedTextInputProps = {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  mode: "englishName" | "passport";
  helperText?: string;
  helperTone?: "muted" | "alert";
};

const patterns = {
  englishName: /^[A-Za-z\s]*$/,
  passport: /^[A-Za-z0-9]*$/,
} as const;

export function ValidatedTextInput({
  name,
  label,
  placeholder,
  defaultValue = "",
  mode,
  helperText,
  helperTone = "muted",
}: ValidatedTextInputProps) {
  const [value, setValue] = useState(defaultValue);
  const isValid = useMemo(() => patterns[mode].test(value), [mode, value]);
  const hasValue = value.trim().length > 0;

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        dir="ltr"
        inputMode="text"
        className={`w-full rounded-2xl border bg-sand px-4 py-3 text-sm outline-none ${
          hasValue && !isValid ? "border-[#a03232]" : "border-black/10"
        }`}
        aria-invalid={hasValue && !isValid}
      />
      {helperText ? (
        <p className={`mt-1 text-xs ${helperTone === "alert" ? "font-semibold text-[#a03232]" : "text-ink/50"}`}>
          {helperText}
        </p>
      ) : null}
      {hasValue && !isValid ? (
        <p className="mt-1 text-xs font-semibold text-[#a03232]">
          يجب إدخال البيانات باللغة الإنجليزية فقط
        </p>
      ) : null}
    </label>
  );
}
