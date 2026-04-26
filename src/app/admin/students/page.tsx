import { AdminShell } from "@/components/admin/admin-shell";
import { AdminStudentsTable } from "@/components/admin/admin-students-table";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminStudentsViewModel } from "@/features/admin/server/get-admin-students";
import { LoadingLink } from "@/components/shared/loading-link";

const statuses = [
  ["", "كل الحالات"],
  ["NEW", "جديد"],
  ["INCOMPLETE", "توجد نواقص"],
  ["UNDER_REVIEW", "قيد المراجعة"],
  ["WAITING_PAYMENT", "بانتظار السداد"],
  ["COMPLETED", "مكتمل"],
];

const presetViews = [
  { key: "all", label: "الكل", description: "كل الطلبات" },
  { key: "needs_action", label: "يحتاج إجراء", description: "عمل إداري مفتوح" },
  { key: "missing_documents", label: "ناقص مستندات", description: "ملفات ناقصة أو إعادة رفع" },
  { key: "outstanding_payment", label: "متبقٍ مالي", description: "رصيد يحتاج متابعة" },
  { key: "unread_messages", label: "رسائل غير مقروءة", description: "محادثات تحتاج قراءة" },
  { key: "completed", label: "مكتمل", description: "طلبات مكتملة" },
] as const;

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

  function presetHref(view: string) {
    const params = new URLSearchParams();
    if (viewModel.filters.q) params.set("q", viewModel.filters.q);
    if (viewModel.filters.status) params.set("status", viewModel.filters.status);
    params.set("view", view);
    return `/admin/students?${params.toString()}`;
  }

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
          <LoadingLink
            href="/admin/students/new"
            className="inline-flex items-center justify-center rounded-xl bg-pine px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pine/90"
          >
            إضافة طالب جديد
          </LoadingLink>
        </div>

        <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-soft">
          <form className="grid gap-3 lg:grid-cols-[minmax(14rem,1.4fr)_12rem_auto]">
            <input
              type="search"
              name="q"
              defaultValue={viewModel.filters.q}
              placeholder="ابحث باسم الطالب أو رقم ولي الأمر"
              className="rounded-xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine/40 focus:bg-white"
            />
            <select
              name="status"
              defaultValue={viewModel.filters.status}
              className="rounded-xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine/40 focus:bg-white"
            >
              {statuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input type="hidden" name="view" value={viewModel.filters.view} />
            <button
              type="submit"
              className="rounded-xl bg-pine px-5 py-3 text-sm font-bold text-white transition hover:bg-pine/90"
            >
              تطبيق
            </button>
          </form>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {presetViews.map((view) => {
              const active = viewModel.filters.view === view.key;
              const count = viewModel.presetCounts[view.key];
              return (
                <LoadingLink
                  key={view.key}
                  href={presetHref(view.key)}
                  className={`min-w-[9rem] whitespace-nowrap rounded-2xl px-3 py-2 text-right text-xs transition ${
                    active
                      ? "bg-pine text-white shadow-soft"
                      : "border border-black/10 bg-sand text-ink/70 hover:bg-white hover:text-ink"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3 font-extrabold">
                    <span>{view.label}</span>
                    <span className={active ? "text-white/80" : "text-ink/45"}>{count}</span>
                  </span>
                  <span className={`mt-1 block text-[11px] font-semibold ${active ? "text-white/70" : "text-ink/45"}`}>
                    {view.description}
                  </span>
                </LoadingLink>
              );
            })}
          </div>
        </section>

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
