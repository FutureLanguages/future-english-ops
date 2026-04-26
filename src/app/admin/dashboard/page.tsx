import { AlertCircle, ArrowUpLeft, CheckCircle2, ClipboardList, FileText, MessageCircle, Wallet } from "lucide-react";
import { AdminExportTrigger } from "@/components/admin/admin-export-trigger";
import { AdminShell } from "@/components/admin/admin-shell";
import { LoadingLink } from "@/components/shared/loading-link";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminDashboardViewModel } from "@/features/admin/server/get-admin-dashboard";

const panelIcons = {
  المستندات: FileText,
  المالية: Wallet,
  الرسائل: MessageCircle,
  "المتابعة العامة": ClipboardList,
};

function priorityClass(priority: "high" | "medium" | "low") {
  if (priority === "high") {
    return "border-pine/20 bg-mist";
  }

  if (priority === "medium") {
    return "border-clay/40 bg-clay/20";
  }

  return "border-black/5 bg-sand";
}

function panelClass(tone: "neutral" | "attention" | "success") {
  if (tone === "attention") {
    return "bg-clay/20";
  }

  if (tone === "success") {
    return "bg-mist";
  }

  return "bg-sand";
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  const viewModel = await getAdminDashboardViewModel({
    adminMobileNumber: session.mobileNumber,
  });
  const primaryQueue = viewModel.actionQueue[0];

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="لوحة التحكم"
      subtitle="مركز تشغيل سريع يوضح ما يحتاج انتباه الإدارة الآن."
    >
      <div className="space-y-5">
        <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-bold text-pine">مركز العمليات</div>
              <h1 className="mt-1 text-2xl font-extrabold text-ink">ما الذي يحتاج إجراء الآن؟</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                هذه اللوحة لا تكرر القائمة الجانبية؛ هي تختصر طوابير العمل اليومية وتفتح لك المكان الصحيح مباشرة.
              </p>
            </div>
            <AdminExportTrigger title="تصدير البيانات" currentFilters={{ view: "all" }} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {viewModel.kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-2xl bg-sand px-4 py-3">
                <div className="text-xs font-bold text-ink/50">{kpi.label}</div>
                <div className="mt-1 text-2xl font-extrabold text-ink">{kpi.value}</div>
                {kpi.detail ? <div className="mt-1 text-xs leading-5 text-ink/55">{kpi.detail}</div> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-ink">طابور الإجراءات المطلوبة</h2>
                <p className="mt-1 text-sm text-ink/60">
                  أعلى الأعمال أولوية في النظام، مرتبة لتقليل وقت القرار.
                </p>
              </div>
              {primaryQueue ? (
                <span className="rounded-full bg-pine px-3 py-1 text-xs font-bold text-white">
                  الأولوية الآن: {primaryQueue.value}
                </span>
              ) : null}
            </div>

            <div className="mt-5 space-y-3">
              {viewModel.actionQueue.map((action) => (
                <LoadingLink
                  key={action.label}
                  href={action.href}
                  className={`group block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-soft ${priorityClass(action.priority)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {action.priority === "high" ? (
                          <AlertCircle className="size-4 text-pine" />
                        ) : (
                          <ClipboardList className="size-4 text-ink/45" />
                        )}
                        <h3 className="text-base font-extrabold text-ink">{action.label}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink/60">{action.description}</p>
                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-pine">
                        فتح الطابور
                        <ArrowUpLeft className="size-4 transition group-hover:-translate-x-0.5 group-hover:translate-y-0.5" />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/75 px-4 py-3 text-center">
                      <div className="text-3xl font-extrabold text-ink">{action.value}</div>
                      <div className="text-xs font-bold text-ink/45">حالة</div>
                    </div>
                  </div>
                </LoadingLink>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-ink">طلاب يحتاجون متابعة</h2>
                <p className="mt-1 text-sm text-ink/60">أقرب ملفات تستحق الفتح الآن.</p>
              </div>
              <LoadingLink
                href="/admin/students?view=needs_action"
                className="rounded-full bg-sand px-3 py-2 text-xs font-bold text-pine transition hover:bg-mist"
              >
                عرض الكل
              </LoadingLink>
            </div>

            <div className="mt-5 space-y-3">
              {viewModel.studentsNeedingAction.length > 0 ? (
                viewModel.studentsNeedingAction.map((student) => (
                  <LoadingLink
                    key={student.applicationId}
                    href={student.href}
                    className="block rounded-2xl border border-black/5 bg-sand px-4 py-3 transition hover:bg-mist"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-ink">{student.studentName}</div>
                        <div className="mt-1 text-sm leading-6 text-ink/60">{student.nextActionLabel}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-ink/50">
                          <span className="rounded-full bg-white px-2 py-1">اكتمال {student.completionPercent}%</span>
                          {student.documentsNeedingReviewCount > 0 ? (
                            <span className="rounded-full bg-white px-2 py-1">
                              مستندات مراجعة {student.documentsNeedingReviewCount}
                            </span>
                          ) : null}
                          {student.unreadMessagesCount > 0 ? (
                            <span className="rounded-full bg-white px-2 py-1">
                              رسائل {student.unreadMessagesCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-left text-sm font-bold text-ink">
                        {student.remainingAmountSar > 0 ? `${student.remainingAmountSar} ر.س` : "لا متبقي"}
                      </div>
                    </div>
                  </LoadingLink>
                ))
              ) : (
                <div className="rounded-2xl bg-mist px-4 py-5 text-sm font-semibold text-pine">
                  لا توجد ملفات تحتاج متابعة عاجلة الآن.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {viewModel.workPanels.map((panel) => {
            const Icon = panelIcons[panel.label as keyof typeof panelIcons] ?? ClipboardList;

            return (
              <div key={panel.label} className={`rounded-2xl border border-black/5 p-5 ${panelClass(panel.tone)}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-2xl bg-white/80 p-3 text-pine">
                    <Icon className="size-5" />
                  </div>
                  {panel.tone === "success" ? <CheckCircle2 className="size-5 text-pine" /> : null}
                </div>
                <div className="mt-4 text-sm font-bold text-ink/55">{panel.label}</div>
                <div className="mt-1 text-3xl font-extrabold text-ink">{panel.value}</div>
                <p className="mt-2 min-h-10 text-sm leading-6 text-ink/60">{panel.detail}</p>
                <LoadingLink
                  href={panel.href}
                  className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-pine transition hover:bg-sand"
                >
                  {panel.actionLabel}
                </LoadingLink>
              </div>
            );
          })}
        </section>
      </div>
    </AdminShell>
  );
}
