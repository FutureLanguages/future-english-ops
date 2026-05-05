import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEntityHeader } from "@/components/admin/admin-entity-header";
import { getAdminNavItems } from "@/features/admin/server/nav";
import { getAdminSession } from "@/features/auth/server/admin-session";
import {
  getOrCreateApplicationPortalConfig,
  getPortalModeOptions,
  getPortalSurfaceDefinitions,
  portalModeLabels,
  resolvePortalSurfaces,
} from "@/features/portal/server/portal-config";
import { prisma } from "@/lib/db/prisma";
import { updatePortalConfigAction } from "./actions";

export default async function AdminPortalConfigPage({
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
        title="إعدادات البوابة"
      >
        <div className="rounded-panel bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink">لم يتم العثور على الطلب</h2>
        </div>
      </AdminShell>
    );
  }

  const config = await getOrCreateApplicationPortalConfig(applicationId);
  const resolution = resolvePortalSurfaces({
    mode: config.mode,
    overrides: config,
  });
  const modeOptions = getPortalModeOptions();
  const definitions = getPortalSurfaceDefinitions();
  const feedback =
    resolvedSearchParams?.success === "portal_config_updated"
      ? { tone: "success" as const, text: "تم تحديث إعدادات البوابة بنجاح." }
      : resolvedSearchParams?.error
        ? { tone: "error" as const, text: "تعذر تحديث إعدادات البوابة. تحقق من القيم المدخلة." }
        : null;

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
          key: "portal-config",
          label: "إعدادات البوابة",
          href: `/admin/students/${applicationId}/portal-config`,
          active: true,
        },
      ]}
      title="إعدادات بوابة الطالب وولي الأمر"
      subtitle="تحديد نمط البوابة والأسطح المسموحة لهذا الطلب بدون إنشاء بيانات وهمية."
    >
      <div className="space-y-5">
        {feedback ? (
          <section
            className={`rounded-panel p-4 text-sm font-semibold shadow-soft ${
              feedback.tone === "success"
                ? "bg-[#e9f7ee] text-[#1b7a43]"
                : "bg-[#ffe8e8] text-[#a03232]"
            }`}
          >
            {feedback.text}
          </section>
        ) : null}

        <AdminEntityHeader
          name={application.studentProfile?.fullNameAr ?? "طالب بدون اسم"}
          typeLabel="الطالب"
          mobileNumber={application.studentUser.mobileNumber}
        />

        <form action={updatePortalConfigAction} className="space-y-5">
          <input type="hidden" name="applicationId" value={applicationId} />

          <section className="rounded-panel bg-white p-5 shadow-soft">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">نمط البوابة</h2>
                <p className="mt-1 text-sm leading-6 text-ink/60">
                  النمط يحدد القيم الافتراضية للأسطح. يمكن تغيير كل سطح بشكل مستقل أدناه.
                </p>
              </div>
              <Link
                href={`/admin/students/${applicationId}`}
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-sand px-4 py-2 text-sm font-semibold text-ink"
              >
                العودة إلى ملف الطالب
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {modeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border px-4 py-4 transition ${
                    config.mode === option.value
                      ? "border-pine bg-mist text-ink"
                      : "border-black/10 bg-white text-ink/70 hover:bg-sand"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={option.value}
                    defaultChecked={config.mode === option.value}
                    className="ml-2"
                  />
                  <span className="font-bold">{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-panel bg-white p-5 shadow-soft">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-ink">الأسطح المعتمدة</h2>
              <p className="mt-1 text-sm leading-6 text-ink/60">
                القيمة الافتراضية تأتي من نمط البوابة. التفعيل لا يعني العرض للمستخدم إلا إذا كانت البيانات الفعلية مدعومة.
              </p>
            </div>

            <div className="space-y-3">
              {resolution.items.map((item) => {
                const definition = definitions.find((surface) => surface.key === item.key)!;
                const defaultLabel = item.modeDefault ? "مفعل افتراضياً" : "غير مفعل افتراضياً";
                const overrideLabel =
                  item.override === null
                    ? "يرث من النمط"
                    : item.override
                      ? "مفعل يدوياً"
                      : "معطل يدوياً";

                return (
                  <div key={item.key} className="rounded-2xl border border-black/10 bg-sand/55 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-ink">{item.label}</h3>
                        <p className="mt-1 text-sm leading-6 text-ink/60">{definition.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-white px-3 py-1 text-ink/60">
                            {portalModeLabels[resolution.mode]}: {defaultLabel}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-ink/60">
                            override: {overrideLabel}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 ${
                              item.enabled ? "bg-[#e9f7ee] text-[#1b7a43]" : "bg-white text-ink/55"
                            }`}
                          >
                            {item.enabled ? "مفعل بعد الدمج" : "غير مفعل بعد الدمج"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 ${
                              item.renderable ? "bg-pine text-white" : "bg-[#fff8e1] text-[#7a5a03]"
                            }`}
                          >
                            {item.supportLabel}
                          </span>
                        </div>
                      </div>
                      <div className="grid gap-2 text-sm font-semibold text-ink/70 sm:grid-cols-3 lg:min-w-[24rem]">
                        <label className="rounded-xl bg-white px-3 py-2">
                          <input
                            type="radio"
                            name={item.key}
                            value="inherit"
                            defaultChecked={item.override === null}
                            className="ml-2"
                          />
                          يرث
                        </label>
                        <label className="rounded-xl bg-white px-3 py-2">
                          <input
                            type="radio"
                            name={item.key}
                            value="true"
                            defaultChecked={item.override === true}
                            className="ml-2"
                          />
                          تفعيل
                        </label>
                        <label className="rounded-xl bg-white px-3 py-2">
                          <input
                            type="radio"
                            name={item.key}
                            value="false"
                            defaultChecked={item.override === false}
                            className="ml-2"
                          />
                          تعطيل
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-2xl bg-pine px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-pine/90"
            >
              حفظ إعدادات البوابة
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
