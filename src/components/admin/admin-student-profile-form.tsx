"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ValidatedTextInput } from "@/components/portal/validated-text-input";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { SchoolStageSelect } from "@/components/shared/school-stage-select";

export function AdminStudentProfileForm({
  applicationId,
  values,
}: {
  applicationId: string;
  values: {
    mobileNumber: string;
    email: string;
    fullNameAr: string;
    fullNameEn: string;
    birthDate: string;
    gender: string;
    nationality: string;
    city: string;
    schoolName: string;
    languageLevel: string;
    hobbies: string;
    schoolStage: string;
    passportNumber: string;
    nationalIdNumber: string;
  };
}) {
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [nationalityMode, setNationalityMode] = useState(values.nationality === "سعودي" ? "saudi" : "other");
  const [otherNationality, setOtherNationality] = useState(
    values.nationality && values.nationality !== "سعودي" ? values.nationality : "",
  );
  const [identityNumber, setIdentityNumber] = useState(values.nationalIdNumber);

  function normalizeNumericInput(value: string) {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  function messageForStudentError(code?: string) {
    if (code === "mobile_in_use") {
      return "رقم الجوال مستخدم لحساب آخر.";
    }
    if (code === "invalid_english_fields") {
      return "تحقق من الاسم الإنجليزي ورقم الجواز بالأحرف الإنجليزية فقط.";
    }
    if (code === "invalid_email") {
      return "يرجى إدخال بريد إلكتروني صحيح.";
    }
    if (code === "email_in_use") {
      return "هذا البريد الإلكتروني مستخدم مسبقًا.";
    }
    if (code === "duplicate_identity_number") {
      return "هذا الرقم مستخدم مسبقًا";
    }
    if (code === "invalid_identity_fields") {
      return "يرجى إدخال الجنسية ورقم الهوية أو الإقامة بشكل صحيح.";
    }
    return "تعذر حفظ بيانات الطالب حالياً.";
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
            const response = await fetch(`/api/admin/students/${applicationId}/profile`, {
              method: "POST",
              body: new FormData(form),
            });
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
              setToast({ tone: "error", message: messageForStudentError(payload?.error) });
              return;
            }

            setToast({ tone: "success", message: "تم تحديث بيانات الطالب بنجاح." });
          });
        }}
      >
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">الاسم</label>
          <input
            name="fullNameAr"
            defaultValue={values.fullNameAr}
            placeholder="أدخل الاسم الكامل"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <ValidatedTextInput
          name="fullNameEn"
          defaultValue={values.fullNameEn}
          label="الاسم بالإنجليزية"
          placeholder="أدخل الاسم بالإنجليزية"
          mode="englishName"
          helperText="يجب أن يكون مطابقًا للجواز"
          helperTone="alert"
        />
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">رقم الجوال</label>
          <input
            name="mobileNumber"
            defaultValue={values.mobileNumber}
            placeholder="أدخل رقم الجوال"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">البريد الإلكتروني (اختياري)</label>
          <input
            name="email"
            type="email"
            defaultValue={values.email}
            placeholder="example@email.com"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">الجنسية</label>
          <select
            name="nationalityMode"
            value={nationalityMode}
            onChange={(event) => setNationalityMode(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          >
            <option value="saudi">سعودي</option>
            <option value="other">أخرى</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">
            {nationalityMode === "saudi" ? "رقم الهوية" : "رقم الإقامة"}
          </label>
          <input
            name="nationalIdNumber"
            value={identityNumber}
            onChange={(event) => setIdentityNumber(normalizeNumericInput(event.target.value))}
            placeholder={nationalityMode === "saudi" ? "أدخل رقم الهوية" : "أدخل رقم الإقامة"}
            inputMode="numeric"
            maxLength={10}
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
          <p className="mt-1 text-xs font-semibold text-[#a03232]">أرقام فقط وبحد أقصى 10 خانات</p>
        </div>
        {nationalityMode === "other" ? (
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">الجنسية الأخرى</label>
            <input
              name="nationality"
              value={otherNationality}
              onChange={(event) => setOtherNationality(event.target.value)}
              placeholder="أدخل الجنسية"
              className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            />
          </div>
        ) : (
          <input type="hidden" name="nationality" value="سعودي" />
        )}
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
          <label className="mb-1 block text-sm font-semibold text-ink">تاريخ الميلاد</label>
          <input
            type="date"
            name="birthDate"
            defaultValue={values.birthDate}
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">الجنس</label>
          <select
            name="gender"
            defaultValue={values.gender}
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          >
            <option value="">اختر الجنس</option>
            <option value="ذكر">ذكر</option>
            <option value="أنثى">أنثى</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">المدينة</label>
          <input
            name="city"
            defaultValue={values.city}
            placeholder="أدخل المدينة"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">المدرسة</label>
          <input
            name="schoolName"
            defaultValue={values.schoolName}
            placeholder="أدخل المدرسة"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">مستوى اللغة</label>
          <select
            name="languageLevel"
            defaultValue={values.languageLevel}
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          >
            <option value="">اختر المستوى</option>
            <option value="مبتدئ">مبتدئ</option>
            <option value="متوسط">متوسط</option>
            <option value="متقدم">متقدم</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">المرحلة الدراسية</label>
          <SchoolStageSelect value={values.schoolStage} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-ink">الهوايات</label>
          <textarea
            name="hobbies"
            rows={2}
            defaultValue={values.hobbies}
            placeholder="اكتب الهوايات أو الاهتمامات"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ..." : "حفظ بيانات الطالب"}
          </button>
          <Link
            href={`/admin/students/${applicationId}`}
            className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
          >
            العودة إلى ملف الطالب
          </Link>
        </div>
      </form>
    </>
  );
}
