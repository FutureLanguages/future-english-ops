import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ApplicationStatusBadge } from "@/components/shared/application-status-badge";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminFinanceViewModel } from "@/features/admin/server/get-admin-finance";

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    paymentView?: string;
    sort?: string;
  }>;
}) {
  const session = await getAdminSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getAdminFinanceViewModel({
    adminMobileNumber: session.mobileNumber,
    status: resolvedSearchParams?.status,
    paymentView: resolvedSearchParams?.paymentView,
    sort: resolvedSearchParams?.sort,
  });

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="الوضع المالي"
      subtitle="ملخص تشغيلي للرسوم والخصومات والمدفوعات والمتبقي على مستوى جميع الطلاب."
    >
      <div className="space-y-5">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">إجمالي الرسوم</div>
            <div className="mt-2 text-2xl font-bold text-ink">{viewModel.summary.totalFeesSar} ر.س</div>
          </div>
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">إجمالي الخصومات</div>
            <div className="mt-2 text-2xl font-bold text-ink">{viewModel.summary.totalDiscountSar} ر.س</div>
          </div>
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">إجمالي المدفوعات</div>
            <div className="mt-2 text-2xl font-bold text-ink">{viewModel.summary.totalPaidSar} ر.س</div>
          </div>
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">إجمالي المتبقي</div>
            <div className="mt-2 text-2xl font-bold text-ink">{viewModel.summary.totalRemainingSar} ر.س</div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">عدد الطلاب المكتمل سدادهم</div>
            <div className="mt-2 text-2xl font-bold text-ink">{viewModel.summary.fullyPaidStudentsCount}</div>
          </div>
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">عدد الطلاب عليهم متبقي</div>
            <div className="mt-2 text-2xl font-bold text-ink">{viewModel.summary.studentsWithRemainingCount}</div>
          </div>
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">أعلى مديونية</div>
            <div className="mt-2 text-base font-bold text-ink">
              {viewModel.summary.highestRemainingStudent?.studentName ?? "لا يوجد"}
            </div>
            <div className="mt-1 text-sm text-ink/60">
              {viewModel.summary.highestRemainingStudent
                ? `${viewModel.summary.highestRemainingStudent.remainingSar} ر.س`
                : "لا يوجد متبقي حالياً"}
            </div>
          </div>
        </section>

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <form className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,auto]">
            <select
              name="status"
              defaultValue={viewModel.filters.status}
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            >
              <option value="">كل حالات الطلب</option>
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
              <option value="remaining_only">فقط الطلاب عليهم متبقي</option>
              <option value="paid_only">فقط الطلاب المكتمل سدادهم</option>
            </select>
            <select
              name="sort"
              defaultValue={viewModel.filters.sort}
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
            >
              <option value="highest_remaining">الأعلى مديونية أولاً</option>
              <option value="lowest_remaining">الأقل مديونية أولاً</option>
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white"
            >
              تطبيق
            </button>
          </form>
        </section>

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-ink">ترتيب الطلاب حسب المتبقي</h2>
            <p className="mt-1 text-sm text-ink/60">
              ترتيب تشغيلي واضح يساعد الإدارة على متابعة أعلى الحالات المالية المتأخرة أولاً.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-right text-sm font-bold text-ink">الطالب</th>
                  <th className="px-3 py-2 text-right text-sm font-bold text-ink">الحالة</th>
                  <th className="px-3 py-2 text-right text-sm font-bold text-ink">إجمالي الرسوم</th>
                  <th className="px-3 py-2 text-right text-sm font-bold text-ink">إجمالي الخصم</th>
                  <th className="px-3 py-2 text-right text-sm font-bold text-ink">المدفوع</th>
                  <th className="px-3 py-2 text-right text-sm font-bold text-ink">المتبقي</th>
                  <th className="px-3 py-2 text-right text-sm font-bold text-ink">فتح الملف</th>
                </tr>
              </thead>
              <tbody>
                {viewModel.rows.length > 0 ? viewModel.rows.map((row) => (
                  <tr
                    key={row.applicationId}
                    className={row.remainingSar > 0 ? "bg-clay/15" : "bg-sand"}
                    title={row.remainingSar > 0 ? "يوجد مبلغ متبقٍ" : "السداد مكتمل"}
                  >
                    <td className="rounded-r-2xl px-3 py-3 text-sm font-semibold text-ink">{row.studentName}</td>
                    <td className="px-3 py-3 text-sm"><ApplicationStatusBadge status={row.status} compact /></td>
                    <td className="px-3 py-3 text-sm text-ink">{row.totalFeesSar} ر.س</td>
                    <td className="px-3 py-3 text-sm text-ink">{row.totalDiscountSar} ر.س</td>
                    <td className="px-3 py-3 text-sm text-ink">{row.totalPaidSar} ر.س</td>
                    <td className={`px-3 py-3 text-sm font-bold text-ink ${row.remainingSar > 0 ? "bg-clay/25" : "bg-mist/80"}`}>
                      {row.remainingSar} ر.س
                    </td>
                    <td className="rounded-l-2xl px-3 py-3 text-sm">
                      <Link href={`/admin/students/${row.applicationId}`} className="font-semibold text-pine">
                        عرض الطلب
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="rounded-2xl bg-sand px-4 py-6 text-center text-sm text-ink/55">
                      لا توجد نتائج مالية مطابقة للفلاتر الحالية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
