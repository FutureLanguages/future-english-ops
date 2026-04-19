import Link from "next/link";
import { Eye } from "lucide-react";
import { AdminEntityHeader } from "@/components/admin/admin-entity-header";
import { AdminShell } from "@/components/admin/admin-shell";
import { PasswordField } from "@/components/shared/password-field";
import { ApplicationStatusBadge } from "@/components/shared/application-status-badge";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminParentDetailsViewModel } from "@/features/admin/server/get-admin-parent-details";
import { getAdminNavItems } from "@/features/admin/server/nav";
import { resetAccountPasswordAction } from "@/app/admin/students/[applicationId]/actions";

export default async function AdminParentDetailsPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const session = await getAdminSession();
  const { parentId } = await params;
  const viewModel = await getAdminParentDetailsViewModel({
    adminMobileNumber: session.mobileNumber,
    parentId,
  });

  if (!viewModel) {
    return (
      <AdminShell
        mobileNumber={session.mobileNumber}
        navItems={getAdminNavItems("parents")}
        title="تفاصيل ولي الأمر"
      >
        <div className="rounded-panel bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink">لم يتم العثور على ولي الأمر</h2>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="ملف ولي الأمر"
      subtitle="عرض موحد لحساب ولي الأمر والطلاب والطلبات المرتبطة به."
    >
      <div className="space-y-5">
        <AdminEntityHeader
          name={viewModel.parent.fullName?.trim() || "ولي أمر بدون اسم"}
          typeLabel="ولي الأمر"
          mobileNumber={viewModel.parent.mobileNumber}
        />

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">معلومات ولي الأمر</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">الاسم</div>
              <div className="mt-2 text-lg font-bold text-ink">
                {viewModel.parent.fullName?.trim() || "ولي أمر بدون اسم"}
              </div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">رقم الجوال</div>
              <div className="mt-2 text-lg font-bold text-ink">{viewModel.parent.mobileNumber}</div>
            </div>
          </div>

          <form action={resetAccountPasswordAction} className="mt-4 space-y-3 rounded-2xl bg-mist px-4 py-4">
            <input type="hidden" name="userId" value={viewModel.parent.id} />
            <input type="hidden" name="redirectTo" value={`/admin/parents/${viewModel.parent.id}`} />
            <PasswordField
              name="nextPassword"
              label="كلمة المرور الجديدة"
              placeholder="اتركه فارغاً لاستخدام كلمة المرور الافتراضية"
              helperText="يمكنك كتابة كلمة مرور جديدة أو ترك الحقل فارغًا لاستخدام النمط الافتراضي."
            />
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" name="forceChange" defaultChecked />
              <span>إجبار ولي الأمر على تغيير كلمة المرور عند الدخول</span>
            </label>
            <button
              type="submit"
              className="rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white"
            >
              إعادة تعيين كلمة مرور ولي الأمر
            </button>
          </form>
        </section>

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">الطلاب المرتبطون</h2>
            <span className="text-sm font-medium text-ink/55">
              {viewModel.linkedApplications.length} طلب
            </span>
          </div>
          <div className="mt-4 grid gap-4">
            {viewModel.linkedApplications.map((application) => (
              <div key={application.applicationId} className="rounded-panel bg-sand p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-bold text-ink">{application.studentName}</div>
                      <ApplicationStatusBadge status={application.status} compact />
                    </div>
                    <div className="text-sm text-ink/60">
                      آخر تحديث:{" "}
                      {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(
                        application.updatedAt,
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/students/${application.applicationId}`}
                    className="inline-flex items-center gap-2 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-pine/90"
                  >
                    <Eye className="h-4 w-4" strokeWidth={2.1} />
                    <span>عرض الطلب</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">الطلبات المرتبطة</h2>
          <div className="mt-4 grid gap-4">
            {viewModel.linkedApplications.map((application) => (
              <Link
                key={`link-${application.applicationId}`}
                href={`/admin/students/${application.applicationId}`}
                className="block rounded-panel bg-sand p-4 transition hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-base font-bold text-ink">{application.studentName}</div>
                    <div className="text-sm text-ink/60">معرّف الطلب: {application.applicationId}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ApplicationStatusBadge status={application.status} compact />
                    <span className="text-sm font-semibold text-pine">فتح الطلب</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
