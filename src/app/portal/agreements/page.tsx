import Link from "next/link";
import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalShell } from "@/components/portal/portal-shell";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalAgreementsViewModel } from "@/features/portal/server/get-portal-agreements";

type AgreementListItem = NonNullable<Awaited<ReturnType<typeof getPortalAgreementsViewModel>>>["agreements"][number];

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

  const groups = buildAgreementGroups(viewModel.agreements);
  const hasActionNeeded = groups.some((group) => group.id === "needs-approval" && group.items.length > 0);

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
      <div className="space-y-6">
        {resolvedSearchParams?.success || resolvedSearchParams?.error ? (
          <BaseCard
            variant="outlined"
            className={resolvedSearchParams?.success ? "border-success-100 bg-success-100/60" : "border-error-100 bg-error-100/60"}
          >
            <BaseCardBody>
              <p className={resolvedSearchParams?.success ? "text-body font-bold text-success-700" : "text-body font-bold text-error-600"}>
                {agreementFeedbackMessage(resolvedSearchParams)}
              </p>
            </BaseCardBody>
          </BaseCard>
        ) : null}

        <section className="space-y-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={hasActionNeeded ? "يوجد اعتماد مطلوب" : "لا يوجد اعتماد مطلوب من هذا الحساب"}
                variant={hasActionNeeded ? "warning" : "complete"}
              />
              <StatusBadge label={viewModel.role === "STUDENT" ? "حساب الطالب" : "حساب ولي الأمر"} variant="info" />
            </div>
            <h1 className="mt-4 text-h1 font-extrabold leading-9 text-text-primary">الميثاق والموافقات</h1>
            <p className="mt-3 text-body leading-7 text-text-secondary">
              {viewModel.role === "PARENT"
                ? "راجع المواثيق التي تحتاج اعتماد ولي الأمر وما ينتظر الطالب، مع إبقاء تفاصيل التوقيع خاصة بكل حساب."
                : "راجع المواثيق المطلوبة منك واعرف بوضوح ما إذا كان الاعتماد مطلوباً الآن."}
            </p>
            {hasActionNeeded ? (
              <HelperText className="mt-2">
                ابدأ بالمواثيق التي تحتاج اعتمادك، ثم تابع المواثيق التي تنتظر الطرف الآخر أو المكتملة.
              </HelperText>
            ) : null}
          </div>

          <ApplicationSwitcher
            options={viewModel.applicationOptions}
            selectedApplicationId={viewModel.selectedApplicationId}
            basePath="/portal/agreements"
          />
        </section>

        {viewModel.agreements.length === 0 ? (
          <EmptyState
            title="لا توجد مواثيق مسندة حالياً"
            description="عند إسناد ميثاق لهذا الطلب سيظهر هنا مع الطرف المطلوب منه الاعتماد."
          />
        ) : (
          <>
            {!hasActionNeeded ? (
              <BaseCard variant="outlined" className="border-secondary-100 bg-secondary-100/60">
                <BaseCardBody>
                  <h2 className="text-h2 font-extrabold text-text-primary">لا يوجد اعتماد مطلوب منك الآن</h2>
                  <p className="mt-2 text-body leading-7 text-text-secondary">
                    قد تكون المواثيق مكتملة أو بانتظار الطرف الآخر. يمكنك فتح أي ميثاق لمراجعة الحالة والتفاصيل.
                  </p>
                </BaseCardBody>
              </BaseCard>
            ) : null}

            {groups.map((group) => (
              <AgreementGroup key={group.id} group={group} />
            ))}
          </>
        )}
      </div>
    </PortalShell>
  );
}

function agreementFeedbackMessage(searchParams: { success?: string; error?: string }) {
  if (searchParams.success === "agreement_cancellation_approved") {
    return "تمت الموافقة على إلغاء الميثاق وحذفه من الطلب.";
  }

  if (searchParams.error) {
    return "يجب الموافقة على الميثاق قبل استكمال البيانات.";
  }

  return "تم تحديث حالة الميثاق بنجاح.";
}

function buildAgreementGroups(agreements: AgreementListItem[]) {
  return [
    {
      id: "needs-approval",
      title: "مواثيق تحتاج اعتمادك",
      description: "هذه المواثيق تحتاج قراءة واعتمادًا من هذا الحساب.",
      badge: { label: "إجراء مطلوب", variant: "warning" as const },
      items: agreements.filter((agreement) => agreement.currentRoleNeedsApproval && !agreement.cancellationRequestedAt),
    },
    {
      id: "waiting-other",
      title: "بانتظار الطرف الآخر",
      description: "هذا الحساب أنهى المطلوب أو لا يلزمه إجراء، وما زال الاعتماد ينتظر الطرف الآخر.",
      badge: { label: "بانتظار", variant: "waiting" as const },
      items: agreements.filter(
        (agreement) => !agreement.currentRoleNeedsApproval && agreement.waitingOnOtherSide && !agreement.cancellationRequestedAt,
      ),
    },
    {
      id: "cancellation",
      title: "حالات إلغاء مرتبطة بميثاق",
      description: "توجد حالة إلغاء قائمة على هذه المواثيق. افتح الميثاق لقراءة التوضيح المتاح.",
      badge: { label: "حالة إلغاء", variant: "warning" as const },
      items: agreements.filter((agreement) => agreement.cancellationRequestedAt),
    },
    {
      id: "complete",
      title: "مواثيق مكتملة",
      description: "هذه المواثيق مكتملة من الأطراف المطلوبة أو لا تحتاج إجراء إضافي.",
      badge: { label: "مكتملة", variant: "complete" as const },
      items: agreements.filter(
        (agreement) =>
          agreement.fullyAccepted &&
          !agreement.currentRoleNeedsApproval &&
          !agreement.waitingOnOtherSide &&
          !agreement.cancellationRequestedAt,
      ),
    },
  ].filter((group) => group.items.length > 0);
}

function AgreementGroup({
  group,
}: {
  group: ReturnType<typeof buildAgreementGroups>[number];
}) {
  return (
    <section className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-h2 font-extrabold text-text-primary">{group.title}</h2>
          <StatusBadge label={group.badge.label} variant={group.badge.variant} />
        </div>
        <p className="mt-2 text-body leading-7 text-text-secondary">{group.description}</p>
      </div>
      <div className="grid gap-4">
        {group.items.map((agreement) => (
          <AgreementListCard key={agreement.id} agreement={agreement} />
        ))}
      </div>
    </section>
  );
}

function AgreementListCard({ agreement }: { agreement: AgreementListItem }) {
  const status = agreementStatus(agreement);

  return (
    <BaseCard variant="outlined" className={status.cardClass}>
      <BaseCardBody className="space-y-4">
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-h3 font-extrabold text-text-primary">{agreement.title}</h3>
              <StatusBadge label={status.label} variant={status.variant} />
            </div>
            <p className="mt-2 text-body leading-7 text-text-secondary">{status.description}</p>
            <p className="mt-2 text-helper leading-6 text-text-muted">
              تاريخ الإسناد:{" "}
              {new Intl.DateTimeFormat("ar-SA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(agreement.assignedAt)}
            </p>
          </div>
          <Button asChild variant={agreement.currentRoleNeedsApproval ? "primary" : "secondary"} size="sm">
            <Link href={`/portal/agreements/${agreement.id}`}>
              {agreement.currentRoleNeedsApproval ? "فتح والاعتماد" : "عرض الميثاق"}
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 tablet:grid-cols-3">
          <PartyStatus
            label="الطالب"
            required={agreement.requiresStudentAcceptance}
            accepted={agreement.studentAccepted}
          />
          <PartyStatus
            label="ولي الأمر"
            required={agreement.requiresParentAcceptance}
            accepted={agreement.parentAccepted}
          />
          <div className="rounded-lg border border-border-subtle bg-bg-surface-alt px-4 py-3">
            <div className="text-caption font-bold text-text-muted">المطلوب الآن</div>
            <p className="mt-1 text-helper font-bold text-text-secondary">{agreement.actionOwnerLabel}</p>
          </div>
        </div>

        {agreement.cancellationRequestedAt ? (
          <div className="rounded-lg border border-warning-100 bg-warning-100/60 px-4 py-3">
            <div className="text-caption font-bold text-warning-500">حالة إلغاء قائمة</div>
            <p className="mt-1 text-body leading-7 text-text-secondary">
              توجد حالة إلغاء مرتبطة بهذا الميثاق. افتحه لقراءة التوضيح والإجراء المتاح حاليًا.
            </p>
          </div>
        ) : null}
      </BaseCardBody>
    </BaseCard>
  );
}

function agreementStatus(agreement: AgreementListItem): {
  label: string;
  description: string;
  variant: StatusBadgeProps["variant"];
  cardClass: string;
} {
  if (agreement.cancellationRequestedAt) {
    return {
      label: "حالة إلغاء",
      description: "توجد حالة إلغاء مرتبطة بهذا الميثاق وتحتاج قراءة التوضيح داخل صفحة الميثاق.",
      variant: "warning",
      cardClass: "border-warning-100 bg-warning-100/40",
    };
  }

  if (agreement.currentRoleNeedsApproval) {
    return {
      label: "يحتاج اعتمادك",
      description: "هذا الميثاق يحتاج قراءة واعتمادًا من هذا الحساب.",
      variant: "warning",
      cardClass: "border-warning-100 bg-warning-100/40",
    };
  }

  if (agreement.waitingOnOtherSide) {
    return {
      label: "بانتظار الطرف الآخر",
      description: "لا يوجد إجراء مطلوب منك الآن، وما زال الاعتماد ينتظر الطرف الآخر.",
      variant: "waiting",
      cardClass: "border-secondary-100 bg-secondary-100/40",
    };
  }

  return {
    label: "مكتمل",
    description: "تم اعتماد الميثاق من الأطراف المطلوبة ولا يحتاج إجراء إضافي.",
    variant: "complete",
    cardClass: "border-success-100 bg-bg-surface",
  };
}

function PartyStatus({
  accepted,
  label,
  required,
}: {
  label: string;
  required: boolean;
  accepted: boolean;
}) {
  const display = !required ? "غير مطلوب" : accepted ? "تم الاعتماد" : "بانتظار الاعتماد";

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface-alt px-4 py-3">
      <div className="text-caption font-bold text-text-muted">{label}</div>
      <div className="mt-2">
        <StatusBadge
          label={display}
          variant={!required || accepted ? "complete" : "warning"}
        />
      </div>
    </div>
  );
}
