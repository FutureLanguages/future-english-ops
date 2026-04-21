import { redirect } from "next/navigation";
import { changePasswordAction } from "./actions";
import { requireAuthenticatedSession } from "@/features/auth/server/session";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

const errorMessages = {
  missing_fields: "يرجى تعبئة جميع الحقول المطلوبة.",
  invalid_current_password: "كلمة المرور الحالية غير صحيحة.",
  password_mismatch: "تأكيد كلمة المرور لا يطابق كلمة المرور الجديدة.",
  weak_password: "كلمة المرور الجديدة لا تحقق جميع الشروط المطلوبة.",
  same_password: "يرجى اختيار كلمة مرور جديدة مختلفة عن الحالية.",
} as const;

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: keyof typeof errorMessages }>;
}) {
  const session = await requireAuthenticatedSession();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = resolvedSearchParams?.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  if (!session.mustChangePassword && session.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  if (!session.mustChangePassword && (session.role === "STUDENT" || session.role === "PARENT")) {
    redirect("/portal/dashboard");
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-xl rounded-panel bg-white p-6 shadow-soft md:p-8">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-pine/70">
            FUTURE ENGLISH
          </p>
          <h1 className="mt-3 text-2xl font-bold text-ink md:text-3xl">
            تغيير كلمة المرور
          </h1>
          <p className="mt-3 text-sm leading-7 text-ink/65">
            يجب تغيير كلمة المرور قبل المتابعة إلى النظام.
          </p>
        </div>

        <ChangePasswordForm action={changePasswordAction} error={error} />
      </div>
    </main>
  );
}
