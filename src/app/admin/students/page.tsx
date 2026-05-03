import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEntitySwitcher } from "@/components/admin/admin-entity-switcher";
import { AdminStudentsControls } from "@/components/admin/admin-students-controls";
import { AdminStudentsTable } from "@/components/admin/admin-students-table";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminStudentsViewModel } from "@/features/admin/server/get-admin-students";
import { LoadingLink } from "@/components/shared/loading-link";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    view?: string;
    sort?: string;
  }>;
}) {
  const session = await getAdminSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getAdminStudentsViewModel({
    adminMobileNumber: session.mobileNumber,
    q: resolvedSearchParams?.q,
    status: resolvedSearchParams?.status,
    view: resolvedSearchParams?.view,
    sort: resolvedSearchParams?.sort,
  });

  const summary = {
    total: viewModel.rows.length,
    needsAction: viewModel.rows.filter((row) => row.needsAction).length,
    documents: viewModel.rows.filter((row) => row.missingDocumentsCount + row.reuploadCount > 0).length,
    payment: viewModel.rows.filter((row) => row.remainingAmountSar > 0).length,
    unread: viewModel.rows.reduce((sum, row) => sum + row.unreadMessagesCount, 0),
  };

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="الطلاب"
      subtitle="قائمة تشغيلية سريعة للبحث والمقارنة وفتح ملفات الطلاب حسب الأولوية."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm leading-6 text-ink/60">
            العرض الافتراضي يركز على الطلبات التي تحتاج متابعة فعلية.
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminEntitySwitcher
              currentId=""
              buttonLabel="فتح طالب مباشرة"
              searchPlaceholder="ابحث باسم الطالب"
              items={viewModel.rows.map((row) => ({
                id: row.id,
                label: row.studentName,
                description: row.nextActionLabel,
                href: `/admin/students/${row.id}`,
              }))}
            />
            <LoadingLink
              href="/admin/students/new"
              className="inline-flex items-center justify-center rounded-xl bg-pine px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pine/90"
            >
              إضافة طالب جديد
            </LoadingLink>
          </div>
        </div>

        <AdminStudentsControls filters={viewModel.filters} presetCounts={viewModel.presetCounts} />

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["النتائج", summary.total],
            ["تحتاج إجراء", summary.needsAction],
            ["مستندات ناقصة", summary.documents],
            ["متبقٍ مالي", summary.payment],
            ["رسائل غير مقروءة", summary.unread],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-black/10 bg-white px-4 py-3">
              <div className="text-xs font-bold text-ink/50">{label}</div>
              <div className="mt-1 text-xl font-extrabold text-ink">{value}</div>
            </div>
          ))}
        </section>

        <AdminStudentsTable rows={viewModel.rows} filters={viewModel.filters} />
      </div>
    </AdminShell>
  );
}
