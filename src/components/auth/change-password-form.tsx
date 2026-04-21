"use client";

import { useMemo, useState } from "react";
import { PasswordField } from "@/components/shared/password-field";

const rules = [
  { key: "length", label: "8 أحرف على الأقل", test: (value: string) => value.length >= 8 },
  { key: "uppercase", label: "حرف كبير واحد على الأقل", test: (value: string) => /[A-Z]/.test(value) },
  { key: "number", label: "رقم واحد على الأقل", test: (value: string) => /\d/.test(value) },
  { key: "special", label: "رمز خاص واحد على الأقل", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export function ChangePasswordForm({
  action,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  error: string | null;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const checks = useMemo(
    () => rules.map((rule) => ({ ...rule, valid: rule.test(newPassword) })),
    [newPassword],
  );
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = checks.every((check) => check.valid) && passwordsMatch;

  return (
    <form action={action} className="mt-6 space-y-4">
      <PasswordField
        id="currentPassword"
        name="currentPassword"
        label="كلمة المرور الحالية"
        placeholder="أدخل كلمة المرور الحالية"
        required
      />
      <PasswordField
        id="newPassword"
        name="newPassword"
        label="كلمة المرور الجديدة"
        placeholder="أدخل كلمة المرور الجديدة"
        required
        onValueChange={setNewPassword}
      />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="تأكيد كلمة المرور الجديدة"
        placeholder="أعد إدخال كلمة المرور الجديدة"
        required
        onValueChange={setConfirmPassword}
      />

      <div className="rounded-2xl bg-mist px-4 py-4 text-sm leading-7 text-ink/70">
        <div className="font-bold text-ink">شروط كلمة المرور</div>
        <ul className="mt-2 space-y-1">
          {checks.map((check) => (
            <li key={check.key} className={check.valid ? "font-semibold text-pine" : "text-ink/60"}>
              {check.valid ? "✔ " : "• "}
              {check.label}
            </li>
          ))}
          <li className={passwordsMatch ? "font-semibold text-pine" : "text-ink/60"}>
            {passwordsMatch ? "✔ " : "• "}
            تأكيد كلمة المرور مطابق
          </li>
        </ul>
      </div>

      {error ? (
        <div className="rounded-2xl bg-[#ffe8e8] px-4 py-3 text-sm font-medium text-[#a03232]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        حفظ كلمة المرور
      </button>
    </form>
  );
}
