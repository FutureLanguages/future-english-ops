"use client";

import { useTransition, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { ValidatedTextInput } from "@/components/portal/validated-text-input";

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-sm font-semibold text-ink">{children}</label>;
}

function DataAccuracyDisclaimer() {
  return (
    <div className="rounded-2xl border border-black/10 bg-mist/50 px-4 py-3 text-xs leading-6 text-ink/65">
      أقر بأن جميع البيانات المدخلة صحيحة ودقيقة، وأتحمل كامل المسؤولية عن أي خطأ أو نقص في هذه البيانات، ولا تتحمل مؤسسة مستقبل اللغات أو منسوبيها أي مسؤولية ناتجة عن ذلك.
    </div>
  );
}

function messageForError(code?: string) {
  if (code === "mobile_used_by_other_account") {
    return "رقم الجوال مستخدم لحساب آخر، يرجى استخدام رقم مختلف.";
  }
  if (code === "invalid_english_fields") {
    return "يرجى إدخال الاسم الإنجليزي ورقم الجواز بالأحرف والأرقام الإنجليزية فقط.";
  }
  if (code === "agreement_required") {
    return "يجب الموافقة على الميثاق قبل استكمال البيانات.";
  }
  return "تعذر تنفيذ العملية المطلوبة حالياً.";
}

async function submitForm(url: string, form: HTMLFormElement) {
  const response = await fetch(url, {
    method: "POST",
    body: new FormData(form),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string; code?: string } | null;

  if (!response.ok) {
    return { ok: false as const, error: payload?.error };
  }

  return { ok: true as const, code: payload?.code };
}

export function PortalStudentProfileForm({
  applicationId,
  values,
}: {
  applicationId: string;
  values: {
    fullNameAr: string;
    fullNameEn: string;
    birthDate: string;
    gender: string;
    nationality: string;
    nationalIdNumber: string;
    city: string;
    schoolName: string;
    passportNumber: string;
  };
}) {
  const router = useRouter();
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
    if (code === "duplicate_identity_number") {
      return "هذا الرقم مستخدم مسبقًا";
    }
    if (code === "invalid_identity_fields") {
      return "يرجى إدخال الجنسية ورقم الهوية أو الإقامة بشكل صحيح.";
    }

    return messageForError(code);
  }

  return (
    <>
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          startTransition(async () => {
            const result = await submitForm("/api/portal/profile/student", form);
            if (!result.ok) {
              setToast({ tone: "error", message: messageForStudentError(result.error) });
              return;
            }

            setToast({ tone: "success", message: "تم تحديث بيانات الطالب بنجاح." });
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        <div>
          <FieldLabel>الاسم بالعربية</FieldLabel>
          <input
            name="fullNameAr"
            defaultValue={values.fullNameAr}
            placeholder="أدخل الاسم بالعربية"
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
          <FieldLabel>تاريخ الميلاد</FieldLabel>
          <input
            name="birthDate"
            type="date"
            defaultValue={values.birthDate}
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <FieldLabel>الجنس</FieldLabel>
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
          <FieldLabel>الجنسية</FieldLabel>
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
          <FieldLabel>{nationalityMode === "saudi" ? "رقم الهوية" : "رقم الإقامة"}</FieldLabel>
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
            <FieldLabel>الجنسية الأخرى</FieldLabel>
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
        <div>
          <FieldLabel>المدينة</FieldLabel>
          <input
            name="city"
            defaultValue={values.city}
            placeholder="أدخل المدينة"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <FieldLabel>المدرسة</FieldLabel>
          <input
            name="schoolName"
            defaultValue={values.schoolName}
            placeholder="أدخل المدرسة"
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
        <div className="md:col-span-2">
          <DataAccuracyDisclaimer />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ..." : "حفظ بيانات الطالب"}
          </button>
        </div>
      </form>
    </>
  );
}

export function PortalParentProfileForm({
  editor,
}: {
  editor: {
    applicationId: string;
    parentType: string;
    values: {
      fullName: string;
      mobileNumber: string;
      passportNumber: string;
      nationalIdNumber: string;
      relationToStudent: string;
      note: string;
      isDeceased: boolean;
    };
  };
}) {
  const router = useRouter();
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          startTransition(async () => {
            const result = await submitForm("/api/portal/profile/parent", form);
            if (!result.ok) {
              setToast({ tone: "error", message: messageForError(result.error) });
              return;
            }

            setToast({ tone: "success", message: "تم تحديث بيانات ولي الأمر بنجاح." });
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="applicationId" value={editor.applicationId} />
        <input type="hidden" name="parentType" value={editor.parentType} />
        <div>
          <FieldLabel>الاسم</FieldLabel>
          <input
            name="fullName"
            defaultValue={editor.values.fullName}
            placeholder="أدخل الاسم"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <FieldLabel>رقم الجوال</FieldLabel>
          <input
            name="mobileNumber"
            defaultValue={editor.values.mobileNumber}
            placeholder="أدخل رقم الجوال"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <ValidatedTextInput
          name="passportNumber"
          defaultValue={editor.values.passportNumber}
          label="رقم الجواز"
          placeholder="أدخل رقم الجواز"
          mode="passport"
          helperText="يُكتب كما هو في الجواز وبالأحرف الإنجليزية"
          helperTone="alert"
        />
        <div>
          <FieldLabel>رقم الهوية</FieldLabel>
          <input
            name="nationalIdNumber"
            defaultValue={editor.values.nationalIdNumber}
            placeholder="أدخل رقم الهوية"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <FieldLabel>صلة القرابة</FieldLabel>
          <input
            name="relationToStudent"
            defaultValue={editor.values.relationToStudent}
            placeholder="مثال: الأب"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>ملاحظة</FieldLabel>
          <textarea
            name="note"
            rows={3}
            defaultValue={editor.values.note}
            placeholder="ملاحظات إضافية"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink md:col-span-2">
          <input type="checkbox" name="isDeceased" defaultChecked={editor.values.isDeceased} />
          متوفي
        </label>
        <div className="md:col-span-2">
          <DataAccuracyDisclaimer />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ..." : "حفظ بيانات ولي الأمر"}
          </button>
        </div>
      </form>
    </>
  );
}
