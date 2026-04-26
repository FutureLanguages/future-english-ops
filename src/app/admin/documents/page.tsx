import { AdminBulkDownloadPanel } from "@/components/admin/admin-bulk-download-panel";
import { AdminDocumentStatusBadge } from "@/components/admin/admin-document-status-badge";
import { AdminShell } from "@/components/admin/admin-shell";
import { FileActionLinks } from "@/components/shared/file-action-links";
import { LoadingLink } from "@/components/shared/loading-link";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminDocumentsViewModel } from "@/features/admin/server/get-admin-documents";

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    type?: string;
    status?: string;
    student?: string;
    parent?: string;
  }>;
}) {
  const session = await getAdminSession();
  const filters = searchParams ? await searchParams : undefined;
  const viewModel = await getAdminDocumentsViewModel({
    adminMobileNumber: session.mobileNumber,
    type: filters?.type,
    status: filters?.status,
    student: filters?.student,
    parent: filters?.parent,
  });

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="المستندات"
      subtitle="عرض عالمي لكل الملفات المرفوعة مع الفلاتر والتنزيل الجماعي."
    >
      <div className="space-y-5">
        <section className="rounded-panel bg-white p-5 shadow-soft">
          <form className="grid gap-3 md:grid-cols-5">
            <input
              type="text"
              name="student"
              defaultValue={viewModel.filters.student}
              placeholder="اسم الطالب"
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            />
            <input
              type="text"
              name="parent"
              defaultValue={viewModel.filters.parent}
              placeholder="رقم ولي الأمر"
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            />
            <input
              type="text"
              name="type"
              defaultValue={viewModel.filters.type}
              placeholder="نوع المستند"
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            />
            <select
              name="status"
              defaultValue={viewModel.filters.status}
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            >
              <option value="">كل الحالات</option>
              {viewModel.statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white"
            >
              تطبيق
            </button>
          </form>
        </section>

        <AdminBulkDownloadPanel
          items={viewModel.rows.map((row) => ({
            requirementId: row.id,
            title: row.title,
            fileAssetId: row.fileAssetId,
          }))}
        />

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="space-y-3">
            {viewModel.rows.map((row) => (
              <div key={row.id} className="rounded-2xl bg-sand px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-bold text-ink">{row.title}</div>
                      <AdminDocumentStatusBadge status={row.status} />
                    </div>
                    <div className="mt-1 text-sm text-ink/55">
                      الطالب: {row.studentName} | ولي الأمر: {row.parentMobileNumber}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileActionLinks fileAssetId={row.fileAssetId} mimeType={row.fileMimeType} />
                    <LoadingLink
                      href={`/admin/students/${row.applicationId}?tab=documents`}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink"
                    >
                      فتح الطلب
                    </LoadingLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
