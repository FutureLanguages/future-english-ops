import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminMessagesViewModel } from "@/features/admin/server/get-admin-messages";

export default async function AdminMessagesPage() {
  const session = await getAdminSession();
  const viewModel = await getAdminMessagesViewModel({
    adminMobileNumber: session.mobileNumber,
  });

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="الرسائل"
      subtitle="صندوق متابعة سريع للطلبات التي تحتوي على رسائل جديدة أو نشطة."
    >
      <div className="space-y-4">
        {viewModel.rows.length > 0 ? (
          viewModel.rows.map((row) => (
            <div key={row.applicationId} className="rounded-panel bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-bold text-ink">{row.studentName}</div>
                  <div className="mt-1 text-sm text-ink/55">
                    {row.latestMessage ?? "لا توجد رسائل في هذا الطلب حتى الآن."}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink">
                    غير مقروء: {row.unreadCount}
                  </span>
                  <Link
                    href={`/admin/students/${row.applicationId}?tab=messages`}
                    className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white"
                  >
                    فتح المحادثة
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-panel bg-white p-5 text-sm text-ink/60 shadow-soft">
            لا توجد محادثات حتى الآن.
          </div>
        )}
      </div>
    </AdminShell>
  );
}
