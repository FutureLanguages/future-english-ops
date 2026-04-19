"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";

function messageForError(code?: string) {
  if (code === "missing_mobile") {
    return "يرجى إدخال رقم الجوال.";
  }

  if (code === "duplicate_mobile") {
    return "يوجد حساب مستخدم مسبقًا بهذا الرقم.";
  }

  return "تعذر إنشاء حساب الطالب حالياً.";
}

export function AdminCreateStudentForm() {
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <section className="rounded-panel bg-white p-5 shadow-soft">
        <form
          ref={formRef}
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const mobileNumber = String(new FormData(form).get("mobileNumber") ?? "").trim();
            const initialName = String(new FormData(form).get("initialName") ?? "").trim();

            startTransition(async () => {
              const response = await fetch("/api/admin/students/create", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  mobileNumber,
                  initialName,
                }),
              });

              const payload = (await response.json().catch(() => null)) as { error?: string } | null;

              if (!response.ok) {
                setToast({ tone: "error", message: messageForError(payload?.error) });
                return;
              }

              formRef.current?.reset();
              mobileInputRef.current?.focus();
              setToast({ tone: "success", message: "تم إنشاء حساب الطالب بنجاح" });
            });
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">إنشاء حساب طالب جديد</h2>
              <p className="mt-1 text-sm text-ink/60">
                يتم الإنشاء في الخلفية، ويمكنك المتابعة مباشرة لإضافة طالب آخر دون مغادرة الصفحة.
              </p>
            </div>
            <Link
              href="/admin/students"
              className="rounded-full border border-black/10 bg-sand px-4 py-2 text-sm font-semibold text-ink"
            >
              الرجوع إلى قائمة الطلاب
            </Link>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="mobileNumber">
              رقم الجوال
            </label>
            <input
              ref={mobileInputRef}
              id="mobileNumber"
              name="mobileNumber"
              type="text"
              inputMode="tel"
              required
              className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="initialName">
              الاسم الأولي للطالب (اختياري)
            </label>
            <input
              id="initialName"
              name="initialName"
              type="text"
              className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="rounded-2xl bg-mist px-4 py-4 text-sm leading-7 text-ink/70">
            سيتم إنشاء كلمة مرور افتراضية بهذا النمط:
            <div className="mt-2 font-bold text-ink">آخر 4 أرقام من الجوال + 123456</div>
            وسيُطلب من الطالب تغيير كلمة المرور عند أول دخول.
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "جارٍ إنشاء الحساب..." : "إنشاء الطالب"}
          </button>
        </form>
      </section>
    </>
  );
}
