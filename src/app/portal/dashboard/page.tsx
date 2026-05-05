import { ParentDashboardTemplate } from "@/components/portal/parent-dashboard-template";
import { PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalShell } from "@/components/portal/portal-shell";
import { StudentDashboardTemplate } from "@/components/portal/student-dashboard-template";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalDashboardViewModel } from "@/features/portal/server/get-portal-dashboard";

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
      {viewModel.dashboardKind === "student" ? (
        <StudentDashboardTemplate viewModel={viewModel} />
      ) : (
        <ParentDashboardTemplate viewModel={viewModel} />
      )}
    </PortalShell>
  );
}
