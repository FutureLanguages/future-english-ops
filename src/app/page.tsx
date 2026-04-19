import { getOptionalAuthSession, getPostLoginRedirectPath } from "@/features/auth/server/session";
import { InstitutionLogo } from "@/components/shared/institution-logo";
import { PasswordField } from "@/components/shared/password-field";
import { redirect } from "next/navigation";

const errorMessages = {
  missing_credentials: "يرجى إدخال اسم المستخدم وكلمة المرور.",
  invalid_credentials: "بيانات الدخول غير صحيحة.",
} as const;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: keyof typeof errorMessages }>;
}) {
  const session = await getOptionalAuthSession();

  if (session) {
    redirect(getPostLoginRedirectPath(session));
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = resolvedSearchParams?.error ? errorMessages[resolvedSearchParams.error] : null;

  return (
    <main className="min-h-screen px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-soft md:min-h-[calc(100vh-5rem)] md:grid-cols-[1.05fr,0.95fr]">
        <section className="relative flex min-h-[18rem] items-end overflow-hidden bg-pine p-6 text-white md:min-h-full md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.20),transparent_32%),radial-gradient(circle_at_85%_75%,rgba(220,166,118,0.25),transparent_34%)]" />
          <div className="absolute right-8 top-8 h-28 w-28 rounded-full border border-white/10" />
          <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full bg-white/10 blur-sm" />
          <div className="relative max-w-lg">
            <div className="mb-8 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur">
              Future Languages Platform
            </div>
            <h1 className="text-3xl font-bold leading-[1.5] md:text-5xl">
              ابدأ رحلتك في تعلّم اللغة الإنجليزية
            </h1>
          </div>
        </section>

        <section className="flex items-center p-6 md:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <InstitutionLogo size="md" />
              <h2 className="mt-8 text-3xl font-bold text-ink">تسجيل الدخول</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                الدخول إلى منصة برنامج اللغة الإنجليزية
              </p>
            </div>

            {error ? (
              <div className="mb-4 rounded-2xl bg-[#fff1ea] px-4 py-3 text-sm font-medium text-[#9f4a1f]">
                {error}
              </div>
            ) : null}

            <form action="/auth/login" method="post" className="space-y-4">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-semibold text-ink">
                  رقم الجوال
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  inputMode="tel"
                  className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none focus:border-pine"
                  placeholder="أدخل رقم الجوال"
                  required
                />
              </div>

              <PasswordField
                id="password"
                name="password"
                label="كلمة المرور"
                placeholder="أدخل كلمة المرور"
                required
              />

              <button
                type="submit"
                className="w-full rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-pine/95"
              >
                دخول
              </button>
            </form>

            <div className="mt-6 text-center text-sm font-semibold text-ink/70">
              مؤسسة مستقبل اللغات
            </div>
            <p className="mt-2 text-center text-xs leading-6 text-ink/50">
              الحسابات يتم إنشاؤها من قبل الإدارة فقط.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
