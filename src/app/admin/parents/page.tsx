import { AdminParentsTable } from "@/components/admin/admin-parents-table";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminParentsViewModel } from "@/features/admin/server/get-admin-parents";

export default async function AdminParentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
  }>;
}) {
  const session = await getAdminSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getAdminParentsViewModel({
    adminMobileNumber: session.mobileNumber,
    q: resolvedSearchParams?.q,
  });

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="أولياء الأمور"
      subtitle="قائمة تشغيلية مبسطة بحسابات أولياء الأمور والطلبات المرتبطة بها."
    >
      <div className="space-y-5">
        <section className="rounded-panel bg-white p-5 shadow-soft">
          <form className="grid gap-3 md:grid-cols-[1fr,auto]">
            <input
              type="search"
              name="q"
              defaultValue={viewModel.filters.q}
              placeholder="ابحث برقم ولي الأمر أو اسم الطالب"
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white"
            >
              تطبيق
            </button>
          </form>
        </section>

        <AdminParentsTable rows={viewModel.rows} />
      </div>
    </AdminShell>
  );
}
