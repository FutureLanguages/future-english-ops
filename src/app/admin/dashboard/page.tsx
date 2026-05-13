import Link from "next/link";
import { AlertCircle, ArrowUpLeft, CheckCircle2, ClipboardList, FileText, MessageCircle, Wallet } from "lucide-react";
import { AdminExportTrigger } from "@/components/admin/admin-export-trigger";
import { AdminEntitySwitcher } from "@/components/admin/admin-entity-switcher";
import { AdminShell } from "@/components/admin/admin-shell";
import { LoadingLink } from "@/components/shared/loading-link";
import { BaseCard, BaseCardBody, BaseCardHeader } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminDashboardViewModel } from "@/features/admin/server/get-admin-dashboard";

const panelIcons = {
  المستندات: FileText,
  المالية: Wallet,
  الرسائل: MessageCircle,
  "المتابعة العامة": ClipboardList,
};

function priorityBadge(priority: "high" | "medium" | "low", value: number): {
  label: string;
  variant: StatusBadgeProps["variant"];
} {
  if (value === 0) {
    return { label: "هادئ", variant: "complete" };
  }

  if (priority === "high") {
    return { label: "أولوية عالية", variant: "error" };
  }

  if (priority === "medium") {
    return { label: "يحتاج متابعة", variant: "warning" };
  }

  return { label: "متابعة لاحقة", variant: "waiting" };
}

function queueToneClass(priority: "high" | "medium" | "low", value: number) {
  if (value === 0) {
    return "border-success-100 bg-success-100/35";
  }

  if (priority === "high") {
    return "border-error-100 bg-error-100/45";
  }

  if (priority === "medium") {
    return "border-warning-100 bg-warning-100/45";
  }

  return "border-border-subtle bg-bg-surface-alt";
}

function panelBadgeVariant(tone: "neutral" | "attention" | "success"): StatusBadgeProps["variant"] {
  if (tone === "attention") {
    return "warning";
  }

  if (tone === "success") {
    return "complete";
  }

  return "info";
}

function panelSurfaceClass(tone: "neutral" | "attention" | "success") {
  if (tone === "attention") {
    return "border-warning-100 bg-warning-100/35";
  }

  if (tone === "success") {
    return "border-success-100 bg-success-100/35";
  }

  return "border-border-subtle bg-bg-surface";
}

function formatSar(amount: number) {
  return new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  const viewModel = await getAdminDashboardViewModel({
    adminMobileNumber: session.mobileNumber,
  });
  const primaryQueue = viewModel.actionQueue.find((queue) => queue.value > 0) ?? viewModel.actionQueue[0];
  const activeQueueCount = viewModel.actionQueue.filter((queue) => queue.value > 0).length;
  const immediateQueues = viewModel.actionQueue.filter((queue) => queue.value > 0 && queue.priority === "high");
  const followUpQueues = viewModel.actionQueue.filter((queue) => queue.value > 0 && queue.priority !== "high");
  const calmQueues = viewModel.actionQueue.filter((queue) => queue.value === 0);

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="لوحة التحكم"
      subtitle="مساحة تشغيل يومية تركّز على ما يحتاج انتباه الإدارة الآن."
    >
      <div className="space-y-5">
        <BaseCard variant="elevated" className="bg-secondary-100/70">
          <BaseCardBody className="space-y-5">
            <div className="flex flex-col gap-4 desktop:flex-row desktop:items-start desktop:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={activeQueueCount > 0 ? `${activeQueueCount} طوابير نشطة` : "لا توجد طوابير نشطة"}
                    variant={activeQueueCount > 0 ? "warning" : "complete"}
                  />
                  {primaryQueue ? (
                    <StatusBadge
                      label={`الأولوية الآن: ${primaryQueue.label}`}
                      variant={primaryQueue.value > 0 ? priorityBadge(primaryQueue.priority, primaryQueue.value).variant : "complete"}
                    />
                  ) : null}
                </div>
                <div>
                  <p className="text-caption font-bold text-pine">مركز العمليات</p>
                  <h1 className="mt-1 text-h1 font-extrabold text-text-primary">ما الذي يحتاج إجراء الآن؟</h1>
                  <p className="mt-2 max-w-3xl text-body leading-7 text-text-secondary">
                    هذه اللوحة تختصر طوابير العمل اليومية وتفتح المكان الصحيح مباشرة، بدون تغيير أي قواعد مراجعة أو صلاحيات.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm">
                  <Link href="/admin/students/new">إضافة طالب جديد</Link>
                </Button>
                <AdminEntitySwitcher
                  currentId=""
                  buttonLabel="فتح طالب مباشرة"
                  searchPlaceholder="ابحث باسم الطالب"
                  items={viewModel.studentSwitchItems.map((item) => ({
                    id: item.applicationId,
                    label: item.studentName,
                    description: item.nextActionLabel,
                    href: item.href,
                  }))}
                />
                <AdminExportTrigger title="تصدير البيانات" currentFilters={{ view: "all" }} />
              </div>
            </div>

            <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3 wide:grid-cols-6">
              {viewModel.kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-3">
                  <div className="text-caption font-bold text-text-muted">{kpi.label}</div>
                  <div className="mt-1 text-h1 font-extrabold text-text-primary" dir="ltr">
                    {kpi.value}
                  </div>
                  {kpi.detail ? <HelperText className="mt-1">{kpi.detail}</HelperText> : null}
                </div>
              ))}
            </div>
          </BaseCardBody>
        </BaseCard>

        <section className="grid gap-5 wide:grid-cols-[1.1fr_0.9fr]">
          <BaseCard variant="outlined">
            <BaseCardHeader>
              <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
                <div>
                  <h2 className="text-h2 font-extrabold text-text-primary">طوابير المراجعة والإجراء</h2>
                  <HelperText>
                    ابدأ بالعناصر ذات الأولوية العالية، ثم انتقل إلى المتابعة المالية أو النواقص حسب الحاجة.
                  </HelperText>
                </div>
                <StatusBadge
                  label={immediateQueues.length > 0 ? "يوجد عمل عاجل" : "لا يوجد عاجل الآن"}
                  variant={immediateQueues.length > 0 ? "error" : "complete"}
                />
              </div>
            </BaseCardHeader>

            <BaseCardBody className="space-y-5">
              <QueueGroup
                emptyLabel="لا توجد عناصر عالية الأولوية تحتاج مراجعة الآن."
                items={immediateQueues}
                title="يحتاج انتباه الآن"
              />
              <QueueGroup
                emptyLabel="لا توجد عناصر متابعة إضافية الآن."
                hideWhenEmpty
                items={followUpQueues}
                title="متابعة وتشغيل"
              />
              <QueueGroup
                emptyLabel="كل الطوابير الهادئة مستقرة حالياً."
                hideWhenEmpty
                items={calmQueues}
                title="طوابير هادئة"
              />
            </BaseCardBody>
          </BaseCard>

          <BaseCard variant="outlined">
            <BaseCardHeader>
              <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
                <div>
                  <h2 className="text-h2 font-extrabold text-text-primary">طلبات تستحق الفتح</h2>
                  <HelperText>أقرب ملفات تحتاج قرارًا أو متابعة بناءً على الحالات الحالية.</HelperText>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/admin/students?view=needs_action">عرض الكل</Link>
                </Button>
              </div>
            </BaseCardHeader>

            <BaseCardBody className="space-y-2">
              {viewModel.studentsNeedingAction.length > 0 ? (
                viewModel.studentsNeedingAction.map((student) => (
                  <LoadingLink
                    key={student.applicationId}
                    href={student.href}
                    className="group block rounded-lg border border-border-subtle bg-bg-surface-alt px-3 py-3 transition-[background-color,border-color,box-shadow] duration-default ease-default hover:border-secondary-600 hover:shadow-card"
                  >
                    <div className="grid gap-3 tablet:grid-cols-[1fr_auto] tablet:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-body font-extrabold text-text-primary">{student.studentName}</h3>
                          <StatusBadge label={`اكتمال ${student.completionPercent}%`} variant={student.completionPercent === 100 ? "complete" : "warning"} />
                        </div>
                        <p className="mt-1 text-helper leading-6 text-text-secondary">{student.nextActionLabel}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {student.documentsNeedingReviewCount > 0 ? (
                            <StatusBadge label={`مستندات: ${student.documentsNeedingReviewCount}`} variant="warning" />
                          ) : null}
                          {student.unreadMessagesCount > 0 ? (
                            <StatusBadge label={`رسائل: ${student.unreadMessagesCount}`} variant="action" />
                          ) : null}
                          {student.remainingAmountSar > 0 ? (
                            <StatusBadge label="متبقٍ مالي" variant="warning" />
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 tablet:block tablet:text-left">
                        <div className="text-caption font-bold text-text-muted">المتبقي</div>
                        <div className="text-body font-extrabold text-text-primary" dir="ltr">
                          {student.remainingAmountSar > 0 ? `${formatSar(student.remainingAmountSar)} ر.س` : "0 ر.س"}
                        </div>
                      </div>
                    </div>
                  </LoadingLink>
                ))
              ) : (
                <EmptyState
                  title="لا توجد ملفات تحتاج متابعة عاجلة الآن"
                  description="عند ظهور مستندات أو رسائل أو مبالغ تحتاج مراجعة ستظهر هنا."
                />
              )}
            </BaseCardBody>
          </BaseCard>
        </section>

        <section className="grid gap-4 tablet:grid-cols-2 wide:grid-cols-4">
          {viewModel.workPanels.map((panel) => {
            const Icon = panelIcons[panel.label as keyof typeof panelIcons] ?? ClipboardList;

            return (
              <BaseCard key={panel.label} variant="outlined" className={panelSurfaceClass(panel.tone)}>
                <BaseCardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-lg border border-border-subtle bg-bg-surface p-2 text-pine">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <StatusBadge
                      label={panel.tone === "success" ? "مستقر" : panel.tone === "attention" ? "يحتاج مراجعة" : "للمتابعة"}
                      variant={panelBadgeVariant(panel.tone)}
                    />
                  </div>
                  <div>
                    <div className="text-caption font-bold text-text-muted">{panel.label}</div>
                    <div className="mt-1 text-h1 font-extrabold text-text-primary" dir="ltr">
                      {panel.value}
                    </div>
                    <p className="mt-2 min-h-12 text-body leading-7 text-text-secondary">{panel.detail}</p>
                  </div>
                  <Button asChild variant="secondary" size="sm" fullWidth>
                    <Link href={panel.href}>
                      <span>{panel.actionLabel}</span>
                      {panel.tone === "success" ? <CheckCircle2 className="size-4" aria-hidden="true" /> : null}
                    </Link>
                  </Button>
                </BaseCardBody>
              </BaseCard>
            );
          })}
        </section>
      </div>
    </AdminShell>
  );
}

function QueueGroup({
  emptyLabel,
  hideWhenEmpty,
  items,
  title,
}: {
  emptyLabel: string;
  hideWhenEmpty?: boolean;
  items: Array<{
    label: string;
    description: string;
    value: number;
    href: string;
    priority: "high" | "medium" | "low";
  }>;
  title: string;
}) {
  if (items.length === 0 && hideWhenEmpty) {
    return null;
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-h3 font-extrabold text-text-primary">{title}</h3>
        <span className="text-caption font-bold text-text-muted" dir="ltr">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((action) => {
            const badge = priorityBadge(action.priority, action.value);

            return (
              <LoadingLink
                key={action.label}
                href={action.href}
                className={`group block rounded-lg border px-3 py-3 transition-[background-color,border-color,box-shadow] duration-default ease-default hover:shadow-card ${queueToneClass(action.priority, action.value)}`}
              >
                <div className="grid gap-3 tablet:grid-cols-[1fr_auto] tablet:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {action.priority === "high" && action.value > 0 ? (
                        <AlertCircle className="size-4 text-error-600" aria-hidden="true" />
                      ) : (
                        <ClipboardList className="size-4 text-text-muted" aria-hidden="true" />
                      )}
                      <h4 className="text-body font-extrabold text-text-primary">{action.label}</h4>
                      <StatusBadge label={badge.label} variant={badge.variant} />
                    </div>
                    <p className="mt-1 text-helper leading-6 text-text-secondary">{action.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 tablet:min-w-28 tablet:justify-end">
                    <div className="text-center">
                      <div className="text-h2 font-extrabold text-text-primary" dir="ltr">
                        {action.value}
                      </div>
                      <div className="text-caption font-bold text-text-muted">عنصر</div>
                    </div>
                    <ArrowUpLeft
                      className="size-4 text-pine transition-transform duration-default ease-default group-hover:-translate-x-0.5 group-hover:translate-y-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </LoadingLink>
            );
          })
        ) : (
          <div className="rounded-lg border border-success-100 bg-success-100/35 px-3 py-3 text-body font-bold text-success-700">
            {emptyLabel}
          </div>
        )}
      </div>
    </section>
  );
}
