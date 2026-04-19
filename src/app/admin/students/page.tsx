import { AdminShell } from "@/components/admin/admin-shell";
import { AdminStudentsTable } from "@/components/admin/admin-students-table";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminStudentsViewModel } from "@/features/admin/server/get-admin-students";
import Link from "next/link";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    view?: string;
  }>;
}) {
  const session = await getAdminSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getAdminStudentsViewModel({
    adminMobileNumber: session.mobileNumber,
    q: resolvedSearchParams?.q,
    status: resolvedSearchParams?.status,
    view: resolvedSearchParams?.view,
  });

  const statuses = [
    ["", "كل الحالات"],
    ["NEW", "جديد"],
    ["INCOMPLETE", "غير مكتمل"],
    ["UNDER_REVIEW", "قيد المراجعة"],
    ["WAITING_PAYMENT", "بانتظار السداد"],
    ["COMPLETED", "مكتمل"],
  ];

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="الطلاب"
      subtitle="قائمة تشغيلية للطلبات مع تركيز افتراضي على الحالات التي تحتاج متابعة."
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <Link
            href="/admin/students/new"
            className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white"
          >
            إضافة طالب جديد
          </Link>
        </div>
        <section className="rounded-panel bg-white p-5 shadow-soft">
          <form className="grid gap-3 md:grid-cols-[1.4fr,1fr,1fr,auto]">
            <input
              type="search"
              name="q"
              defaultValue={viewModel.filters.q}
              placeholder="ابحث باسم الطالب أو رقم ولي الأمر"
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            />
            <select
              name="status"
              defaultValue={viewModel.filters.status}
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            >
              {statuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              name="view"
              defaultValue={viewModel.filters.view}
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            >
              <option value="needs_action">تحتاج إجراء</option>
              <option value="all">كل الطلبات</option>
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white"
            >
              تطبيق
            </button>
          </form>
        </section>

        <AdminStudentsTable rows={viewModel.rows} filters={viewModel.filters} />
      </div>
    </AdminShell>
  );
}
