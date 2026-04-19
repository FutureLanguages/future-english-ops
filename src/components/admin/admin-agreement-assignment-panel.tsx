"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";

type AgreementTemplateOption = {
  id: string;
  title: string;
  isDefault: boolean;
};

export function AdminAgreementAssignmentPanel({
  applicationId,
  templates,
}: {
  applicationId: string;
  templates: AgreementTemplateOption[];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(
    endpoint: string,
    form: HTMLFormElement,
    successMessage: string,
  ) {
    startTransition(async () => {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setToast({
          tone: "error",
          message:
            payload?.error === "agreement_failed"
              ? "تعذر إسناد الميثاق. تأكد من اكتمال العنوان والنص والإقرار."
              : "تعذر تنفيذ عملية الميثاق حالياً.",
        });
        return;
      }

      form.reset();
      setToast({ tone: "success", message: successMessage });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />

      <form
        className="rounded-2xl bg-sand p-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(
            `/api/admin/applications/${applicationId}/agreements/assign`,
            event.currentTarget,
            "تم إسناد الميثاق إلى الطلب بنجاح.",
          );
        }}
      >
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">اختيار ميثاق موجود</span>
          <select
            name="templateId"
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            required
            defaultValue=""
          >
            <option value="">اختر الميثاق</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
                {template.isDefault ? " - افتراضي" : ""}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
          <legend className="px-1 text-sm font-semibold text-ink">نطاق الإسناد</legend>
          <div className="mt-2 space-y-2 text-sm text-ink">
            <label className="flex items-center gap-2">
              <input type="radio" name="assignmentScope" value="student_only" />
              إسناد للطالب فقط
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="assignmentScope" value="student_parent" defaultChecked />
              إسناد للطالب وولي الأمر
            </label>
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={isPending}
          className="mt-3 rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "جارٍ الإسناد..." : "إسناد الميثاق"}
        </button>
      </form>

      <form
        className="rounded-2xl bg-sand p-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(
            `/api/admin/applications/${applicationId}/agreements/create`,
            event.currentTarget,
            "تم إنشاء الميثاق وإسناده بنجاح.",
          );
        }}
      >
        <div className="text-sm font-bold text-ink">إنشاء ميثاق مخصص</div>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-semibold text-ink">العنوان</span>
          <input
            name="title"
            placeholder="مثال: ميثاق خاص بالسكن"
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            required
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-semibold text-ink">نص الميثاق</span>
          <textarea
            name="content"
            rows={7}
            placeholder="اكتب بنود الميثاق كاملة"
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            required
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-semibold text-ink">نص الإقرار</span>
          <textarea
            name="acknowledgmentText"
            rows={3}
            placeholder="مثال: أقر بأنني قرأت جميع البنود وأوافق عليها."
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            required
          />
        </label>
        <fieldset className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
          <legend className="px-1 text-sm font-semibold text-ink">نطاق الإسناد</legend>
          <div className="mt-2 space-y-2 text-sm text-ink">
            <label className="flex items-center gap-2">
              <input type="radio" name="assignmentScope" value="student_only" />
              إسناد للطالب فقط
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="assignmentScope" value="student_parent" defaultChecked />
              إسناد للطالب وولي الأمر
            </label>
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={isPending}
          className="mt-3 rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "جارٍ الإنشاء..." : "إنشاء وإسناد"}
        </button>
      </form>
    </div>
  );
}
