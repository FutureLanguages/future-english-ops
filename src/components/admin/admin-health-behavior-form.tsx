"use client";

import { useState, useTransition } from "react";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";

const healthFields = [
  ["medicalConditions", "حالات مرضية"],
  ["allergies", "الحساسية"],
  ["medications", "أدوية مستمرة"],
  ["sleepDisorders", "اضطرابات أو مشاكل النوم"],
  ["bedwetting", "التبول اللاإرادي"],
  ["phobias", "رهاب"],
  ["requiresSpecialAttention", "هل الحالة تتطلب متابعة خاصة من المشرفين؟"],
] as const;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-semibold text-ink">{children}</label>;
}

function messageForError(code?: string) {
  if (code === "application_not_found") {
    return "لم يتم العثور على الطلب.";
  }

  return "تعذر حفظ الحالة الصحية والسلوكية حالياً.";
}

export function AdminHealthBehaviorForm({
  applicationId,
  values,
  parentSupervisorNotes,
  allowStudentView,
  allowStudentEdit,
}: {
  applicationId: string;
  values: Record<string, { hasIssue: boolean; details: string }>;
  parentSupervisorNotes: string;
  allowStudentView: boolean;
  allowStudentEdit: boolean;
}) {
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [studentCanEdit, setStudentCanEdit] = useState(allowStudentEdit);
  const [studentCanView, setStudentCanView] = useState(allowStudentView || allowStudentEdit);
  const [healthState, setHealthState] = useState(
    Object.fromEntries(
      healthFields.map(([key]) => [key, Boolean(values[key]?.hasIssue)]),
    ) as Record<(typeof healthFields)[number][0], boolean>,
  );

  function updateStudentEdit(value: boolean) {
    setStudentCanEdit(value);
    if (value) {
      setStudentCanView(true);
    }
  }

  return (
    <>
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          startTransition(async () => {
            const response = await fetch(`/api/admin/students/${applicationId}/health`, {
              method: "POST",
              body: new FormData(form),
            });
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
              setToast({ tone: "error", message: messageForError(payload?.error) });
              return;
            }

            setToast({ tone: "success", message: "تم حفظ الحالة الصحية والسلوكية بنجاح." });
          });
        }}
      >
        <div className="rounded-2xl border border-black/10 bg-mist/60 p-4">
          <div className="text-sm font-bold text-ink">صلاحيات الطالب</div>
          <div className="mt-3 grid gap-2 text-sm text-ink/80 md:grid-cols-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="allowStudentView"
                checked={studentCanView}
                onChange={(event) => {
                  setStudentCanView(event.target.checked);
                  if (!event.target.checked) {
                    setStudentCanEdit(false);
                  }
                }}
              />
              السماح للطالب بالاطلاع
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="allowStudentEdit"
                checked={studentCanEdit}
                onChange={(event) => updateStudentEdit(event.target.checked)}
              />
              السماح للطالب بالتعديل
            </label>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {healthFields.map(([key, label]) => (
            <div key={key} className="rounded-2xl border border-black/10 bg-sand p-4">
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
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="no">لا</option>
                <option value="yes">نعم</option>
              </select>
              {healthState[key] ? (
                <textarea
                  name={`${key}Details`}
                  rows={2}
                  defaultValue={values[key]?.details ?? ""}
                  placeholder="اذكر التفاصيل عند اختيار نعم"
                  className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
              ) : null}
            </div>
          ))}
        </div>

        <div>
          <FieldLabel>ملاحظات ولي الأمر للمشرفين</FieldLabel>
          <textarea
            name="parentSupervisorNotes"
            rows={4}
            defaultValue={parentSupervisorNotes}
            placeholder="اكتب أي ملاحظات مهمة يحتاج المشرفون معرفتها"
            className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جارٍ الحفظ..." : "حفظ الحالة والملاحظات"}
        </button>
      </form>
    </>
  );
}
