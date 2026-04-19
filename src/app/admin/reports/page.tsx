import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSmartTable } from "@/components/admin/admin-smart-table";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminReportsViewModel } from "@/features/admin/server/get-admin-reports";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    paymentView?: string;
  }>;
}) {
  const session = await getAdminSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getAdminReportsViewModel({
    adminMobileNumber: session.mobileNumber,
    q: resolvedSearchParams?.q,
    status: resolvedSearchParams?.status,
    paymentView: resolvedSearchParams?.paymentView,
  });

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="الجدول الذكي"
      subtitle="عرض مخصص مرن لصف واحد لكل طالب/طلب مع اختيار الأعمدة التي تحتاجها."
    >
      <div className="space-y-5">
        <section className="rounded-panel bg-white p-5 shadow-soft">
          <form className="grid gap-3 md:grid-cols-[1.5fr,1fr,1fr,auto]">
            <input
              type="search"
              name="q"
              defaultValue={viewModel.filters.q}
              placeholder="ابحث باسم الطالب أو الجوال"
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            />
            <select
              name="status"
              defaultValue={viewModel.filters.status}
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            >
              <option value="">كل الحالات</option>
              <option value="NEW">جديد</option>
              <option value="INCOMPLETE">ناقص</option>
              <option value="UNDER_REVIEW">قيد المراجعة</option>
              <option value="WAITING_PAYMENT">بانتظار السداد</option>
              <option value="COMPLETED">مكتمل</option>
            </select>
            <select
              name="paymentView"
              defaultValue={viewModel.filters.paymentView}
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            >
              <option value="all">كل الحالات المالية</option>
              <option value="remaining_only">فقط من لديهم متبقي</option>
              <option value="paid_only">فقط المكتمل سدادهم</option>
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white"
            >
              تطبيق
            </button>
          </form>
        </section>

        <AdminSmartTable
          rows={viewModel.rows}
          columns={viewModel.columns}
          defaultColumnKeys={viewModel.defaultColumnKeys}
          filters={viewModel.filters}
        />
      </div>
    </AdminShell>
  );
}
