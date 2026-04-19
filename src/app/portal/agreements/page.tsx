import Link from "next/link";
import { redirect } from "next/navigation";
import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { DashboardStatusBadge, PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalShell } from "@/components/portal/portal-shell";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalAgreementsViewModel } from "@/features/portal/server/get-portal-agreements";

export default async function PortalAgreementsPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string; error?: string; success?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getPortalAgreementsViewModel({
    user: session,
    applicationId: resolvedSearchParams?.applicationId,
  });

  if (!viewModel) {
    return null;
  }

  if (viewModel.agreements.length === 1) {
    redirect(`/portal/agreements/${viewModel.agreements[0].id}`);
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
        {resolvedSearchParams?.success === "agreement_cancellation_approved" ? (
          <section className="rounded-panel bg-[#e9f7ee] p-4 text-sm font-semibold text-[#1b7a43] shadow-soft">
            تمت الموافقة على إلغاء الميثاق وحذفه من الطلب.
          </section>
        ) : resolvedSearchParams?.error ? (
          <section className="rounded-panel bg-[#ffe8e8] p-4 text-sm font-semibold text-[#a03232] shadow-soft">
            يجب الموافقة على الميثاق قبل استكمال البيانات.
          </section>
        ) : null}

        <PortalPageHeader
          title="الميثاق"
          description="راجع المواثيق المسندة لهذا الطلب. القبول منفصل للطالب وولي الأمر ولا يمكن التراجع عنه بعد الحفظ."
          aside={<DashboardStatusBadge status={viewModel.applicationStatus} />}
        />

        <ApplicationSwitcher
          options={viewModel.applicationOptions}
          selectedApplicationId={viewModel.selectedApplicationId}
          basePath="/portal/agreements"
        />

        <section
          className={`rounded-panel p-4 shadow-soft ${
            viewModel.status.isAccepted ? "bg-mist text-pine" : "bg-clay/25 text-ink"
          }`}
        >
          <div className="text-sm font-bold">{viewModel.status.label}</div>
          <p className="mt-1 text-sm">
            المقبول: {viewModel.status.accepted} من {viewModel.status.total}
          </p>
        </section>

        <section className="grid gap-4">
          {viewModel.agreements.length > 0 ? (
            viewModel.agreements.map((agreement) => (
              <Link
                key={agreement.id}
                href={`/portal/agreements/${agreement.id}`}
                className="block rounded-panel bg-white p-5 shadow-soft transition hover:bg-sand"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-bold text-ink">
                      {agreement.title}
                    </div>
                    <p className="mt-1 text-sm text-ink/60">
                      تاريخ الإسناد:{" "}
                      {new Intl.DateTimeFormat("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).format(agreement.assignedAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span
                        className={`rounded-full px-3 py-1 ${
                          agreement.studentAccepted ? "bg-mist text-pine" : "bg-clay/35 text-ink"
                        }`}
                      >
                        الطالب: {agreement.studentAccepted ? "مكتمل" : "معلّق"}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 ${
                          !agreement.requiresParentAcceptance || agreement.parentAccepted
                            ? "bg-mist text-pine"
                            : "bg-clay/35 text-ink"
                        }`}
                      >
                        ولي الأمر: {!agreement.requiresParentAcceptance ? "غير مطلوب" : agreement.parentAccepted ? "مكتمل" : "معلّق"}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 ${
                          agreement.studentAccepted && (!agreement.requiresParentAcceptance || agreement.parentAccepted)
                            ? "bg-pine text-white"
                            : "bg-sand text-ink"
                        }`}
                      >
                        {agreement.studentAccepted && (!agreement.requiresParentAcceptance || agreement.parentAccepted) ? "الميثاق مكتمل" : "بانتظار الإكمال"}
                      </span>
                    </div>
                    {agreement.cancellationRequestedAt ? (
                      <div className="mt-3 rounded-2xl bg-[#fff1ea] px-3 py-2 text-sm font-semibold text-[#9f4a1f]">
                        تم طلب إلغاء الميثاق المعتمد
                      </div>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-pine px-4 py-2 text-center text-sm font-semibold text-white">
                    فتح الميثاق
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-panel bg-white p-5 text-sm text-ink/65 shadow-soft">
              لا توجد مواثيق مسندة لهذا الطلب حالياً.
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
