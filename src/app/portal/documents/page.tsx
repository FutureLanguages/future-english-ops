import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { DocumentItemCard, type PortalDocumentItem } from "@/components/portal/document-item-card";
import { PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalShell } from "@/components/portal/portal-shell";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { EmptyState } from "@/components/ui/empty-state";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalDocumentsViewModel } from "@/features/portal/server/get-portal-documents";
import { MAX_UPLOAD_SIZE_LABEL } from "@/lib/storage/upload-limits";

export default async function PortalDocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string; success?: string; error?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getPortalDocumentsViewModel({
    user: session,
    applicationId: resolvedSearchParams?.applicationId,
  });

  if (!viewModel) {
    return (
      <PortalShell
        role={session.role}
        navItems={[
          { key: "dashboard", label: "الرئيسية", href: "/portal/dashboard" },
          { key: "documents", label: "المستندات", href: "/portal/documents", active: true },
        ]}
        isDev={devSession.isDev}
        devUsers={devSession.availableUsers}
        currentUserId={session.id}
        activeUserLabel={session.role === "STUDENT" ? "طالب" : "ولي أمر"}
        activeMobileNumber={session.mobileNumber}
      >
        <EmptyState
          title="لا توجد مستندات مرتبطة بهذا الطلب حالياً"
          description="عند إضافة متطلبات مستندات لهذا الطلب ستظهر هنا مع حالة الرفع والمراجعة."
        />
      </PortalShell>
    );
  }

  const allItems = viewModel.groups.flatMap((group) => group.items);
  const displayGroups = buildDocumentDisplayGroups(allItems);
  const hasAnyDocuments = allItems.length > 0;
  const hasActionNeeded = displayGroups.some((group) => group.id === "needs-action" && group.items.length > 0);

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
                {uploadFeedbackMessage(resolvedSearchParams)}
              </p>
            </BaseCardBody>
          </BaseCard>
        ) : null}

        <section className="space-y-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={hasActionNeeded ? "يوجد إجراء مطلوب" : "لا يوجد إجراء مطلوب"}
                variant={hasActionNeeded ? "warning" : "complete"}
              />
              <StatusBadge label={viewModel.role === "STUDENT" ? "حساب الطالب" : "حساب ولي الأمر"} variant="info" />
            </div>
            <h1 className="mt-4 text-h1 font-extrabold leading-9 text-text-primary">
              {viewModel.summary.roleHeading}
            </h1>
            <p className="mt-3 text-body leading-7 text-text-secondary">
              {viewModel.summary.roleDescription}
            </p>
            {hasActionNeeded ? (
              <HelperText className="mt-2">
                ابدأ بالمستندات التي تحتاج إجراء، أما المستندات قيد المراجعة أو المعتمدة فهي للمتابعة فقط.
              </HelperText>
            ) : null}
          </div>

          <ApplicationSwitcher
            options={viewModel.applicationOptions}
            selectedApplicationId={viewModel.selectedApplicationId}
            basePath="/portal/documents"
          />
        </section>

        {!hasAnyDocuments ? (
          <EmptyState
            title="لا توجد مستندات مطلوبة حالياً"
            description="لا توجد متطلبات مستندات ظاهرة لهذا الطلب الآن. عند إضافة متطلبات جديدة ستظهر هنا بوضوح."
          />
        ) : (
          <>
            {!hasActionNeeded ? (
              <BaseCard variant="outlined" className="border-secondary-100 bg-secondary-100/70">
                <BaseCardBody>
                  <h2 className="text-h2 font-extrabold text-text-primary">لا توجد مستندات تحتاج إجراء الآن</h2>
                  <p className="mt-2 text-body leading-7 text-text-secondary">
                    المستندات الحالية إما قيد مراجعة الإدارة أو معتمدة. سنعرض أي مستند يحتاج رفعًا أو إعادة رفع في أعلى هذه الصفحة.
                  </p>
                </BaseCardBody>
              </BaseCard>
            ) : null}

            {displayGroups.map((group) => (
              <DocumentStatusGroup
                key={group.id}
                group={group}
                isDev={devSession.isDev}
              />
            ))}
          </>
        )}
      </div>
    </PortalShell>
  );
}

function uploadFeedbackMessage(searchParams: { success?: string; error?: string }) {
  if (searchParams.success === "document_uploaded") return "تم رفع المستند بنجاح وهو الآن بانتظار المراجعة.";
  if (searchParams.error === "missing_file") return "يرجى اختيار ملف قبل الإرسال.";
  if (searchParams.error === "file_too_large") return `حجم الملف أكبر من الحد المسموح (${MAX_UPLOAD_SIZE_LABEL}).`;
  if (searchParams.error === "unsupported_file_type") return "نوع الملف غير مدعوم. يرجى رفع PDF أو صورة.";
  if (searchParams.error === "already_approved") return "هذا المستند معتمد بالفعل ولا يحتاج إلى رفع جديد.";
  if (searchParams.error === "agreement_required") return "يجب الموافقة على الميثاق قبل استكمال البيانات.";
  return "تعذر تنفيذ عملية المستند المطلوبة حالياً.";
}

function buildDocumentDisplayGroups(items: PortalDocumentItem[]) {
  const needsAction = items.filter((item) =>
    item.status === "MISSING" ||
    item.status === "REJECTED" ||
    item.status === "REUPLOAD_REQUESTED",
  );
  const underReview = items.filter((item) => item.status === "UPLOADED" || item.status === "UNDER_REVIEW");
  const complete = items.filter((item) => item.status === "APPROVED");

  return [
    {
      id: "needs-action",
      title: "مستندات تحتاج إجراء",
      description: "ابدأ من هنا. هذه المستندات ناقصة أو تحتاج إعادة رفع حسب حالة الطلب.",
      badge: { label: "الأولوية الأعلى", variant: "warning" as const },
      items: sortDocuments(needsAction),
    },
    {
      id: "under-review",
      title: "مستندات بانتظار المراجعة",
      description: "تم رفع هذه المستندات وهي الآن لدى الإدارة أو بانتظار المراجعة.",
      badge: { label: "للمتابعة فقط", variant: "waiting" as const },
      items: sortDocuments(underReview),
    },
    {
      id: "complete",
      title: "مستندات مكتملة",
      description: "هذه المستندات معتمدة حالياً ولا تحتاج إجراء.",
      badge: { label: "مكتملة", variant: "complete" as const },
      items: sortDocuments(complete),
    },
  ].filter((group) => group.items.length > 0);
}

function sortDocuments(items: PortalDocumentItem[]) {
  const priority: Record<PortalDocumentItem["status"], number> = {
    REJECTED: 1,
    REUPLOAD_REQUESTED: 2,
    MISSING: 3,
    UPLOADED: 4,
    UNDER_REVIEW: 5,
    APPROVED: 6,
  };

  return items.slice().sort((left, right) => {
    if (priority[left.status] !== priority[right.status]) {
      return priority[left.status] - priority[right.status];
    }

    return left.titleAr.localeCompare(right.titleAr, "ar");
  });
}

function DocumentStatusGroup({
  group,
  isDev,
}: {
  group: ReturnType<typeof buildDocumentDisplayGroups>[number];
  isDev: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-h2 font-extrabold text-text-primary">{group.title}</h2>
            <StatusBadge label={group.badge.label} variant={group.badge.variant} />
          </div>
          <p className="mt-2 text-body leading-7 text-text-secondary">{group.description}</p>
        </div>
      </div>
      <div className="grid gap-4">
        {group.items.map((item) => (
          <DocumentItemCard key={item.requirementId} item={item} isDev={isDev} />
        ))}
      </div>
    </section>
  );
}
