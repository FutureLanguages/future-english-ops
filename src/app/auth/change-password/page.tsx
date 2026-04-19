import { redirect } from "next/navigation";
import { changePasswordAction } from "./actions";
import { requireAuthenticatedSession } from "@/features/auth/server/session";
import { PasswordField } from "@/components/shared/password-field";

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

        <form action={changePasswordAction} className="mt-6 space-y-4">
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
          />
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="تأكيد كلمة المرور الجديدة"
            placeholder="أعد إدخال كلمة المرور الجديدة"
            required
          />

          <div className="rounded-2xl bg-mist px-4 py-4 text-sm leading-7 text-ink/70">
            <div className="font-bold text-ink">شروط كلمة المرور</div>
            <ul className="mt-2 space-y-1">
              <li>8 أحرف على الأقل</li>
              <li>حرف كبير واحد على الأقل</li>
              <li>حرف صغير واحد على الأقل</li>
              <li>رقم واحد على الأقل</li>
              <li>رمز خاص واحد على الأقل</li>
            </ul>
          </div>

          {error ? (
            <div className="rounded-2xl bg-[#ffe8e8] px-4 py-3 text-sm font-medium text-[#a03232]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white"
          >
            حفظ كلمة المرور
          </button>
        </form>
      </div>
    </main>
  );
}
