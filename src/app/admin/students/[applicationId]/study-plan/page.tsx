import Link from "next/link";
import { AdminEntityHeader } from "@/components/admin/admin-entity-header";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { AdminShell } from "@/components/admin/admin-shell";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { getAdminNavItems } from "@/features/admin/server/nav";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { prisma } from "@/lib/db/prisma";
import { updateStudyPlanAction } from "./actions";

function formatDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function inputClassName() {
  return "w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none";
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: "text" | "date";
  value: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-ink">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className={inputClassName()}
      />
    </div>
  );
}

export default async function AdminStudyPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const session = await getAdminSession();
  const { applicationId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      studyPlan: true,
      studentProfile: true,
      studentUser: {
        select: {
          mobileNumber: true,
        },
      },
    },
  });

  if (!application) {
    return (
      <AdminShell
        mobileNumber={session.mobileNumber}
        navItems={getAdminNavItems("students")}
        title="خطة الدراسة"
      >
        <div className="rounded-panel bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink">لم يتم العثور على الطلب</h2>
        </div>
      </AdminShell>
    );
  }

  const feedback =
    resolvedSearchParams?.success === "study_plan_updated"
      ? { tone: "success" as const, text: "تم حفظ خطة الدراسة والسكن والسفر بنجاح." }
      : resolvedSearchParams?.error
        ? { tone: "error" as const, text: "تعذر حفظ خطة الدراسة. تحقق من القيم المدخلة." }
        : null;
  const studyPlan = application.studyPlan;

  return (
    <AdminShell
      mobileNumber={session.mobileNumber}
      navItems={[
        ...getAdminNavItems("students"),
        {
          key: "workspace",
          label: "ملف الطالب",
          href: `/admin/students/${applicationId}`,
        },
        {
          key: "study-plan",
          label: "خطة الدراسة",
          href: `/admin/students/${applicationId}/study-plan`,
          active: true,
        },
      ]}
      title="خطة الدراسة والسكن والسفر"
      subtitle="إدخال البيانات التي تظهر للطالب في بطاقة الدراسة داخل البوابة."
    >
      <div className="space-y-5">
        {feedback ? <AutoDismissToast message={feedback.text} tone={feedback.tone} /> : null}

        <AdminEntityHeader
          name={application.studentProfile?.fullNameAr ?? "طالب بدون اسم"}
          typeLabel="الطالب"
          mobileNumber={application.studentUser.mobileNumber}
        />

        <form action={updateStudyPlanAction} className="space-y-5">
          <input type="hidden" name="applicationId" value={applicationId} />

          <section className="rounded-panel bg-white p-5 shadow-soft">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">بيانات الدراسة</h2>
                <p className="mt-1 text-sm leading-6 text-ink/60">
                  تظهر الحقول المدخلة فقط داخل بطاقة الدراسة للطالب. الحقول الفارغة لا تظهر في البوابة.
                </p>
              </div>
              <Link
                href={`/admin/students/${applicationId}?tab=data`}
                className="rounded-full border border-black/10 bg-sand px-4 py-2 text-sm font-semibold text-ink"
              >
                العودة إلى ملف الطالب
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="اسم المعهد" name="instituteName" value={studyPlan?.instituteName ?? ""} placeholder="مثال: Future English" />
              <Field label="فرع المعهد" name="instituteBranch" value={studyPlan?.instituteBranch ?? ""} placeholder="مثال: الفرع الرئيسي" />
              <Field label="الدولة" name="country" value={studyPlan?.country ?? ""} placeholder="مثال: المملكة المتحدة" />
              <Field label="المدينة" name="city" value={studyPlan?.city ?? ""} placeholder="مثال: لندن" />
              <Field label="اسم البرنامج" name="programName" value={studyPlan?.programName ?? ""} placeholder="مثال: برنامج اللغة الصيفي" />
              <Field label="تاريخ بداية البرنامج" name="programStartDate" type="date" value={formatDateInput(studyPlan?.programStartDate)} />
              <Field label="تاريخ نهاية البرنامج" name="programEndDate" type="date" value={formatDateInput(studyPlan?.programEndDate)} />
            </div>
          </section>

          <section className="rounded-panel bg-white p-5 shadow-soft">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-ink">بيانات السكن</h2>
              <p className="mt-1 text-sm leading-6 text-ink/60">
                هذه البيانات اختيارية وتظهر فقط عند توفرها.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="نوع السكن" name="housingType" value={studyPlan?.housingType ?? ""} placeholder="مثال: سكن عائلي" />
              <Field label="نوع الغرفة" name="roomType" value={studyPlan?.roomType ?? ""} placeholder="مثال: غرفة فردية" />
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-ink">ملاحظات السكن</label>
                <textarea
                  name="housingNotes"
                  rows={3}
                  defaultValue={studyPlan?.housingNotes ?? ""}
                  placeholder="أي تفاصيل مهمة عن السكن أو الترتيبات المرتبطة به"
                  className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>
          </section>

          <section className="rounded-panel bg-white p-5 shadow-soft">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-ink">بيانات السفر</h2>
              <p className="mt-1 text-sm leading-6 text-ink/60">
                ظهور هذه البيانات للطالب يعتمد أيضاً على تفعيل معلومات الرحلة من إعدادات البوابة.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="تاريخ المغادرة" name="departureDate" type="date" value={formatDateInput(studyPlan?.departureDate)} />
              <Field label="تاريخ الوصول" name="arrivalDate" type="date" value={formatDateInput(studyPlan?.arrivalDate)} />
              <Field label="شركة الطيران" name="airlineName" value={studyPlan?.airlineName ?? ""} placeholder="مثال: الخطوط السعودية" />
              <Field label="رقم الرحلة" name="flightNumber" value={studyPlan?.flightNumber ?? ""} placeholder="مثال: SV123" />
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href={`/admin/students/${applicationId}?tab=data`}
              className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
            >
              إلغاء والعودة
            </Link>
            <AdminFormSubmitButton idleLabel="حفظ خطة الدراسة" tone="primary" />
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
