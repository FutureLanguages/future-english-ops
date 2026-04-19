import Link from "next/link";
import { Eye } from "lucide-react";
import { UserIdentity } from "@/components/shared/user-identity";
import type { AdminParentRow } from "@/types/admin";

export function AdminParentsTable({ rows }: { rows: AdminParentRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-panel bg-white p-6 text-sm text-ink/60 shadow-soft">
        لا توجد حسابات أولياء أمور مطابقة لنتائج البحث الحالية.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.parentUserId} className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="space-y-1">
                <UserIdentity
                  name={row.fullName?.trim() || "ولي أمر بدون اسم"}
                  typeLabel="ولي الأمر"
                  mobileNumber={row.mobileNumber}
                  compact
                />
              </div>
              <div className="text-sm text-ink/60">
                الطلاب المرتبطون:{" "}
                {row.linkedStudentNames.length > 0
                  ? row.linkedStudentNames.join("، ")
                  : "لا يوجد أسماء متاحة"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
              <div className="rounded-2xl bg-sand px-3 py-3">
                <div className="text-xs font-medium text-ink/55">عدد الطلبات</div>
                <div className="mt-1 text-base font-bold text-ink">{row.linkedApplicationsCount}</div>
              </div>
              <div className="rounded-2xl bg-sand px-3 py-3">
                <div className="text-xs font-medium text-ink/55">آخر تحديث</div>
                <div className="mt-1 text-base font-bold text-ink">
                  {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(row.latestUpdatedAt)}
                </div>
              </div>
              <div className="col-span-2 flex justify-end">
                <Link
                  href={`/admin/parents/${row.parentUserId}`}
                  className="inline-flex items-center gap-2 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-pine/90"
                >
                  <Eye className="h-4 w-4" strokeWidth={2.1} />
                  <span>عرض</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
