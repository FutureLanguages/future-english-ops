import Link from "next/link";
import { AdminExportTrigger } from "@/components/admin/admin-export-trigger";
import { AdminKpiCard } from "@/components/admin/admin-kpi-card";
import { AdminQueueCard } from "@/components/admin/admin-queue-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminDashboardViewModel } from "@/features/admin/server/get-admin-dashboard";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  const viewModel = await getAdminDashboardViewModel({
    adminMobileNumber: session.mobileNumber,
  });

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="لوحة الإدارة"
      subtitle="ملخص سريع للحالات التشغيلية الأكثر أهمية."
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <AdminExportTrigger title="تصدير البيانات" currentFilters={{ view: "all" }} />
        </div>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {viewModel.kpis.map((kpi) => (
            <AdminKpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              status={kpi.status}
            />
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">قوائم المراجعة</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {viewModel.reviewQueues.map((queue) => (
              <AdminQueueCard
                key={queue.label}
                label={queue.label}
                value={queue.value}
                href={queue.href}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">إجراءات سريعة</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {viewModel.quickActions.map((action) =>
              action.href && !action.disabled ? (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-panel bg-white p-5 shadow-soft transition hover:-translate-y-0.5"
                >
                  <div className="text-base font-bold text-ink">{action.label}</div>
                  <div className="mt-2 text-sm font-semibold text-pine">فتح</div>
                </Link>
              ) : (
                <div key={action.label} className="rounded-panel bg-white p-5 shadow-soft">
                  <div className="text-base font-bold text-ink">{action.label}</div>
                  <div className="mt-2 text-sm font-semibold text-ink/45">
                    {action.devOnlyLabel ?? "قريباً"}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
