"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { ValidatedTextInput } from "@/components/portal/validated-text-input";

export function AdminParentProfileForm({
  applicationId,
  parentType,
  title,
  values,
}: {
  applicationId: string;
  parentType: string;
  title: string;
  values: {
    fullName: string;
    mobileNumber: string;
    passportNumber: string;
    nationalIdNumber: string;
    relationToStudent: string;
    note: string;
    isDeceased: boolean;
  };
}) {
  const router = useRouter();
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function messageForError(code?: string) {
    if (code === "mobile_in_use") {
      return "رقم الجوال مستخدم لحساب آخر، يرجى استخدام رقم مختلف.";
    }
    if (code === "invalid_english_fields") {
      return "يرجى إدخال رقم الجواز بالأحرف والأرقام الإنجليزية فقط.";
    }
    return "تعذر تحديث بيانات ولي الأمر حالياً.";
  }

  return (
    <>
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          startTransition(async () => {
            const response = await fetch(`/api/admin/students/${applicationId}/parent-profile`, {
              method: "POST",
              body: new FormData(form),
            });
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
              setToast({ tone: "error", message: messageForError(payload?.error) });
              return;
            }

            setToast({ tone: "success", message: `تم تحديث ${title} بنجاح.` });
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="parentType" value={parentType} />
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">الاسم</label>
          <input
            name="fullName"
            defaultValue={values.fullName}
            placeholder="أدخل الاسم"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">رقم الجوال</label>
          <input
            name="mobileNumber"
            defaultValue={values.mobileNumber}
            placeholder="أدخل رقم الجوال"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <ValidatedTextInput
          name="passportNumber"
          defaultValue={values.passportNumber}
          label="رقم الجواز"
          placeholder="أدخل رقم الجواز"
          mode="passport"
          helperText="يُكتب كما هو في الجواز وبالأحرف الإنجليزية"
          helperTone="alert"
        />
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">رقم الهوية / الإقامة</label>
          <input
            name="nationalIdNumber"
            defaultValue={values.nationalIdNumber}
            placeholder="أدخل رقم الهوية أو الإقامة"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">صلة القرابة</label>
          <input
            name="relationToStudent"
            defaultValue={values.relationToStudent}
            placeholder="مثال: الأب"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <label className="flex items-center gap-2 self-end text-sm font-semibold text-ink">
          <input type="checkbox" name="isDeceased" defaultChecked={values.isDeceased} />
          متوفي
        </label>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-ink">ملاحظة</label>
          <textarea
            name="note"
            rows={3}
            defaultValue={values.note}
            placeholder="ملاحظات إضافية"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ..." : `حفظ ${title}`}
          </button>
        </div>
      </form>
    </>
  );
}
