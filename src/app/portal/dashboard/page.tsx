import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { CompletionRing } from "@/components/portal/completion-ring";
import { DashboardSectionCard } from "@/components/portal/dashboard-card";
import { DashboardStatusBadge, PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalShell } from "@/components/portal/portal-shell";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalDashboardViewModel } from "@/features/portal/server/get-portal-dashboard";
import Link from "next/link";

export default async function PortalDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getPortalDashboardViewModel({
    user: session,
    applicationId: resolvedSearchParams?.applicationId,
  });

  if (!viewModel) {
    return (
      <PortalShell
        role={session.role}
        navItems={[{ key: "dashboard", label: "الرئيسية", href: "/portal/dashboard", active: true }]}
        isDev={devSession.isDev}
        devUsers={devSession.availableUsers}
        currentUserId={session.id}
        activeUserLabel={session.role === "STUDENT" ? "طالب" : "ولي أمر"}
        activeMobileNumber={session.mobileNumber}
      >
        <div className="rounded-panel bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink">لا توجد طلبات مرتبطة بهذا الحساب</h2>
          <p className="mt-2 text-sm text-ink/65">
            سيتم عرض لوحة المتابعة هنا بعد ربط الحساب بطلب طالب.
          </p>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      role={viewModel.role}
      studentName={viewModel.studentName}
      activeUserLabel={viewModel.activeUserLabel}
      activeMobileNumber={viewModel.mobileNumber}
      statusSlot={
        <PortalOverallCompletionBadge
          label={viewModel.overallCompletion.label}
          percent={viewModel.overallCompletion.percent}
          tone={viewModel.overallCompletion.tone}
        />
      }
      navItems={viewModel.navItems}
      isDev={devSession.isDev}
      devUsers={devSession.availableUsers}
      currentUserId={session.id}
    >
      <div className="space-y-5">
        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <DashboardStatusBadge status={viewModel.status} />
              <div>
                <h2 className="text-2xl font-bold text-ink">لوحة متابعة الطلب</h2>
                <p className="mt-1 text-sm leading-6 text-ink/65">
                  هذه الصفحة تعرض لك ملخصًا مبسطًا لما يخص الطلب، ثم يمكنك الدخول لكل قسم عند الحاجة.
                </p>
              </div>
              <div className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink/75">
                <div className="mb-1 font-semibold text-ink">آخر ملاحظة من الإدارة</div>
                <p>{viewModel.latestAdminNote ?? "لا توجد ملاحظات إدارية حالياً."}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-sand px-4 py-3 text-sm">
                  <div className="text-xs font-medium text-ink/55">
                    {viewModel.progressIndicators.profileDocumentsAgreements.label}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="font-bold text-ink">
                      {viewModel.progressIndicators.profileDocumentsAgreements.statusLabel}
                    </span>
                    <span className="text-xs font-medium text-ink/60">
                      {viewModel.progressIndicators.profileDocumentsAgreements.detailLabel}
                    </span>
                  </div>
                </div>
                {viewModel.progressIndicators.payments ? (
                  <div className="rounded-2xl bg-sand px-4 py-3 text-sm">
                    <div className="text-xs font-medium text-ink/55">
                      {viewModel.progressIndicators.payments.label}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="font-bold text-ink">
                        {viewModel.progressIndicators.payments.statusLabel}
                      </span>
                      <span className="text-xs font-medium text-ink/60">
                        {viewModel.progressIndicators.payments.detailLabel}
                      </span>
                    </div>
                  </div>
                ) : null}
                <div className="rounded-2xl bg-sand px-4 py-3 text-sm">
                  <div className="text-xs font-medium text-ink/55">
                    {viewModel.progressIndicators.messages.label}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="font-bold text-ink">
                      {viewModel.progressIndicators.messages.unreadCount} غير مقروءة
                    </span>
                    <span className="rounded-full bg-clay/35 px-2.5 py-1 text-[11px] font-bold text-ink">
                      {viewModel.progressIndicators.messages.unreadCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <CompletionRing percent={viewModel.completionPercent} />
          </div>
        </section>

        <ApplicationSwitcher
          options={viewModel.applicationOptions}
          selectedApplicationId={viewModel.selectedApplicationId}
          basePath="/portal/dashboard"
        />

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink">ملخص التقدم حسب الأقسام</h3>
              <p className="mt-1 text-sm text-ink/60">
                نظرة سريعة توضح لك ما اكتمل وما يزال بحاجة إلى استكمال.
              </p>
            </div>
            <div className="text-sm font-semibold text-ink/55">ملخص سريع</div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {viewModel.sectionSummaries.map((section) => (
              <Link
                key={section.id}
                href={section.href ?? "#"}
                className="rounded-2xl bg-sand px-4 py-4 transition hover:bg-mist"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-ink">{section.title}</div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      section.tone === "success"
                        ? "bg-[#e9f7ee] text-[#1b7a43]"
                        : section.tone === "warning"
                          ? "bg-[#fff1ea] text-[#9f4a1f]"
                          : "bg-white text-pine"
                    }`}
                  >
                    {section.tone === "success" ? "مكتمل" : section.tone === "warning" ? "يحتاج متابعة" : "متابعة"}
                  </span>
                </div>
                <div className="mt-2 text-sm text-ink/65">{section.statusLabel}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-sm font-semibold text-pine">الخطوة التالية</div>
              <h3 className="mt-1 text-xl font-bold text-ink">{viewModel.nextStep.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink/65">{viewModel.nextStep.description}</p>
            </div>
            {viewModel.nextStep.href ? (
              <Link
                href={viewModel.nextStep.href}
                className="inline-flex items-center justify-center rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white"
              >
                {viewModel.nextStep.ctaLabel ?? "متابعة"}
              </Link>
            ) : (
              <div className="rounded-2xl bg-mist px-4 py-3 text-sm font-semibold text-ink/65">
                راجع الملخص أدناه لمعرفة تفاصيل الطلب
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink">أقسام الطلب</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink/55">بطاقات مختصرة للوصول السريع إلى التفاصيل</span>
              <Link
                href={`/portal/overview?applicationId=${viewModel.selectedApplicationId}`}
                className="inline-flex rounded-full bg-mist px-3 py-2 text-sm font-semibold text-pine"
              >
                عرض كل البيانات
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {viewModel.cards.map((card) => (
              <DashboardSectionCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
