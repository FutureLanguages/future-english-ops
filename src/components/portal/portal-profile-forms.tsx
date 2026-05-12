"use client";

import { useTransition, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { SchoolStageSelect } from "@/components/shared/school-stage-select";
import { ValidatedTextInput } from "@/components/portal/validated-text-input";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-body font-bold text-text-primary">{children}</label>;
}

const fieldControlClassName =
  "w-full rounded-input border border-border-subtle bg-bg-surface-alt px-4 py-3 text-body text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-default ease-default placeholder:text-text-muted focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-border-focus/30 disabled:cursor-not-allowed disabled:opacity-70";

const fieldGroupClassName = "rounded-lg border border-border-subtle bg-bg-surface-alt p-4";

function DataAccuracyDisclaimer() {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface-alt px-4 py-3 text-helper leading-6 text-text-secondary">
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
  if (code === "invalid_email") {
    return "يرجى إدخال بريد إلكتروني صحيح.";
  }
  if (code === "email_in_use") {
    return "هذا البريد الإلكتروني مستخدم مسبقًا.";
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
    email: string;
    fullNameAr: string;
    fullNameEn: string;
    birthDate: string;
    gender: string;
    nationality: string;
    nationalIdNumber: string;
    city: string;
    schoolName: string;
    languageLevel: string;
    hobbies: string;
    schoolStage: string;
    passportNumber: string;
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
        className="mt-4 grid gap-3 tablet:grid-cols-2"
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
          });
        }}
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        <TextInput
          name="email"
          type="email"
          defaultValue={values.email}
          label="البريد الإلكتروني (اختياري)"
          placeholder="example@email.com"
          helperText="نستخدمه عند الحاجة لإرسال تنبيهات مرتبطة بالطلب."
        />
        <div>
          <FieldLabel>الاسم بالعربية</FieldLabel>
          <input
            name="fullNameAr"
            defaultValue={values.fullNameAr}
            placeholder="أدخل الاسم بالعربية"
            className={fieldControlClassName}
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
            className={fieldControlClassName}
          />
        </div>
        <div>
          <FieldLabel>الجنس</FieldLabel>
          <select
            name="gender"
            defaultValue={values.gender}
            className={fieldControlClassName}
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
            className={fieldControlClassName}
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
            className={fieldControlClassName}
          />
          <p className="mt-1 text-caption font-bold text-error-600">أرقام فقط وبحد أقصى 10 خانات</p>
        </div>
        {nationalityMode === "other" ? (
          <div>
            <FieldLabel>الجنسية الأخرى</FieldLabel>
            <input
              name="nationality"
              value={otherNationality}
              onChange={(event) => setOtherNationality(event.target.value)}
              placeholder="أدخل الجنسية"
              className={fieldControlClassName}
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
            className={fieldControlClassName}
          />
        </div>
        <div>
          <FieldLabel>المدرسة</FieldLabel>
          <input
            name="schoolName"
            defaultValue={values.schoolName}
            placeholder="أدخل المدرسة"
            className={fieldControlClassName}
          />
        </div>
        <div>
          <FieldLabel>مستوى اللغة</FieldLabel>
          <select
            name="languageLevel"
            defaultValue={values.languageLevel}
            className={fieldControlClassName}
          >
            <option value="">اختر المستوى</option>
            <option value="مبتدئ">مبتدئ</option>
            <option value="متوسط">متوسط</option>
            <option value="متقدم">متقدم</option>
          </select>
        </div>
        <div>
          <FieldLabel>المرحلة الدراسية</FieldLabel>
          <SchoolStageSelect value={values.schoolStage} />
        </div>
        <div className="tablet:col-span-2">
          <FieldLabel>الهوايات</FieldLabel>
          <textarea
            name="hobbies"
            rows={2}
            defaultValue={values.hobbies}
            placeholder="اكتب الهوايات أو الاهتمامات"
            className={fieldControlClassName}
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
        <div className="tablet:col-span-2">
          <DataAccuracyDisclaimer />
        </div>
        <div className="tablet:col-span-2">
          <Button
            type="submit"
            isLoading={isPending}
            disabled={isPending}
          >
            {isPending ? "جارٍ الحفظ..." : "حفظ بيانات الطالب"}
          </Button>
        </div>
      </form>
    </>
  );
}

const healthFields = [
  ["medicalConditions", "حالات مرضية"],
  ["sleepDisorders", "اضطرابات أو مشاكل النوم"],
  ["allergies", "الحساسية"],
  ["medications", "أدوية مستمرة"],
  ["phobias", "رهاب"],
  ["bedwetting", "التبول اللاإرادي"],
  ["requiresSpecialAttention", "هل الحالة تتطلب متابعة خاصة من المشرفين؟"],
] as const;

export function PortalHealthBehaviorForm({
  applicationId,
  canEdit,
  canEditParentSupervisorNotes,
  showParentSupervisorNotes,
  values,
  parentSupervisorNotes,
}: {
  applicationId: string;
  canEdit: boolean;
  canEditParentSupervisorNotes: boolean;
  showParentSupervisorNotes: boolean;
  values: Record<string, { hasIssue: boolean; details: string }>;
  parentSupervisorNotes: string;
}) {
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [healthState, setHealthState] = useState(
    Object.fromEntries(
      healthFields.map(([key]) => [key, Boolean(values[key]?.hasIssue)]),
    ) as Record<(typeof healthFields)[number][0], boolean>,
  );

  return (
    <>
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          startTransition(async () => {
            const result = await submitForm("/api/portal/profile/health", form);
            if (!result.ok) {
              setToast({ tone: "error", message: messageForError(result.error) });
              return;
            }

            setToast({ tone: "success", message: "تم حفظ الحالة الصحية والسلوكية بنجاح." });
          });
        }}
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        <div className="grid gap-3 tablet:grid-cols-2">
          {healthFields.map(([key, label]) => (
            <div key={key} className={fieldGroupClassName}>
              <FieldLabel>{label}</FieldLabel>
              <select
                name={`${key}HasIssue`}
                value={healthState[key] ? "yes" : "no"}
                onChange={(event) =>
                  setHealthState((current) => ({
                    ...current,
                    [key]: event.target.value === "yes",
                  }))
                }
                disabled={!canEdit}
                className={fieldControlClassName}
              >
                <option value="no">لا</option>
                <option value="yes">نعم</option>
              </select>
              {healthState[key] ? (
                <textarea
                  name={`${key}Details`}
                  rows={2}
                  defaultValue={values[key]?.details ?? ""}
                  disabled={!canEdit}
                  placeholder="اذكر التفاصيل عند اختيار نعم"
                  className={`${fieldControlClassName} mt-3`}
                />
              ) : null}
            </div>
          ))}
        </div>
        {showParentSupervisorNotes ? (
          <div>
            <FieldLabel>ملاحظات ولي الأمر للمشرفين</FieldLabel>
            <textarea
              name="parentSupervisorNotes"
              rows={4}
              defaultValue={parentSupervisorNotes}
              disabled={!canEditParentSupervisorNotes}
              placeholder="اكتب أي ملاحظات مهمة يحتاج المشرفون معرفتها"
              className={fieldControlClassName}
            />
            {!canEditParentSupervisorNotes ? (
              <>
                <input type="hidden" name="parentSupervisorNotes" value={parentSupervisorNotes} />
                <p className="mt-2 text-caption text-text-muted">هذه الملاحظات يكتبها ولي الأمر وتظهر هنا للعرض فقط.</p>
              </>
            ) : null}
          </div>
        ) : null}
        {canEdit || canEditParentSupervisorNotes ? (
          <Button
            type="submit"
            isLoading={isPending}
            disabled={isPending}
          >
            {isPending ? "جارٍ الحفظ..." : "حفظ الحالة والملاحظات"}
          </Button>
        ) : (
          <div className="rounded-lg border border-border-subtle bg-bg-surface-alt px-4 py-3 text-body text-text-secondary">
            هذا القسم مقفل حالياً أو غير متاح للتعديل من هذا الحساب.
          </div>
        )}
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
        className="mt-4 grid gap-3 tablet:grid-cols-2"
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
            className={fieldControlClassName}
          />
        </div>
        <div>
          <FieldLabel>رقم الجوال</FieldLabel>
          <input
            name="mobileNumber"
            defaultValue={editor.values.mobileNumber}
            placeholder="أدخل رقم الجوال"
            className={fieldControlClassName}
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
            className={fieldControlClassName}
          />
        </div>
        <div>
          <FieldLabel>صلة القرابة</FieldLabel>
          <input
            name="relationToStudent"
            defaultValue={editor.values.relationToStudent}
            placeholder="مثال: الأب"
            className={fieldControlClassName}
          />
        </div>
        <div className="tablet:col-span-2">
          <FieldLabel>ملاحظة</FieldLabel>
          <textarea
            name="note"
            rows={3}
            defaultValue={editor.values.note}
            placeholder="ملاحظات إضافية"
            className={fieldControlClassName}
          />
        </div>
        <label className="flex items-center gap-2 text-body font-bold text-text-primary tablet:col-span-2">
          <input type="checkbox" name="isDeceased" defaultChecked={editor.values.isDeceased} />
          متوفي
        </label>
        <div className="tablet:col-span-2">
          <DataAccuracyDisclaimer />
        </div>
        <div className="tablet:col-span-2">
          <Button
            type="submit"
            isLoading={isPending}
            disabled={isPending}
          >
            {isPending ? "جارٍ الحفظ..." : "حفظ بيانات ولي الأمر"}
          </Button>
        </div>
      </form>
    </>
  );
}
