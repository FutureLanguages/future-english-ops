import { UserRole } from "@prisma/client";
import type { ApplicationUser } from "@/types/application";
import type { PortalActionView, PortalDashboardViewModel } from "@/types/portal";
import { loadPortalApplicationData } from "./load-portal-application";
import { buildPortalNavItems, resolveAgreementHref } from "./nav";

function withApplicationId(href: string | undefined, applicationId: string) {
  if (!href) {
    return undefined;
  }

  return `${href}?applicationId=${applicationId}`;
}

function mapActions(params: {
  canSeePayments: boolean;
  actions: Array<{
    id: string;
    label: string;
    section: "student_info" | "parent_info" | "documents" | "payments";
    kind: "missing_profile" | "missing_document" | "reupload_document" | "payment";
    priority: number;
  }>;
}): PortalActionView[] {
  return params.actions.map((action) => {
    if (action.kind === "payment" && !params.canSeePayments) {
      return {
        id: action.id,
        label: "هناك إجراء مطلوب من ولي الأمر",
        section: "info",
        tone: "neutral",
      };
    }

    return {
      id: action.id,
      label: action.label,
      section: action.section,
      href:
        action.section === "documents"
          ? "/portal/documents"
          : action.section === "student_info" || action.section === "parent_info"
            ? "/portal/profile"
            : action.section === "payments"
              ? "/portal/payments"
            : undefined,
      tone: action.priority === 1 ? "critical" : action.priority === 2 ? "warning" : "neutral",
    };
  });
}

function countChecklistStatuses(
  checklist: Array<{
    status: "MISSING" | "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
  }>,
) {
  return checklist.reduce(
    (summary, item) => {
      if (item.status === "MISSING") {
        summary.missing += 1;
      }

      if (item.status === "REJECTED" || item.status === "REUPLOAD_REQUESTED") {
        summary.reupload += 1;
      }

      return summary;
    },
    { missing: 0, reupload: 0 },
  );
}

function buildNextStep(params: {
  actions: PortalActionView[];
  canSeePayments: boolean;
}) {
  const firstAction = params.actions[0];

  if (!firstAction) {
    return {
      title: "الخطوة التالية: الطلب تحت المتابعة",
      description: "لا توجد مهام عاجلة الآن. يمكنك مراجعة الأقسام والتأكد من اكتمال البيانات.",
      href: "/portal/dashboard",
      ctaLabel: "مراجعة الطلب",
    };
  }

  return {
    title: `الخطوة التالية: ${firstAction.label}`,
    description:
      firstAction.section === "documents"
        ? "ابدأ بالمستندات أولًا، فهي غالبًا أسرع خطوة لتحريك الطلب إلى المرحلة التالية."
        : firstAction.section === "student_info" || firstAction.section === "parent_info"
          ? "أكمل البيانات الأساسية أولًا حتى تصبح بقية الأقسام أوضح وأسهل."
          : firstAction.section === "payments" && params.canSeePayments
            ? "راجع الرسوم والدفعات ثم ارفع أو تابع الإيصالات المطلوبة."
            : "راجع الإشعارات الحالية لمعرفة المطلوب من الحساب المرتبط.",
    href: firstAction.href,
    ctaLabel: firstAction.href ? "متابعة" : undefined,
  };
}

export async function getPortalDashboardViewModel(params: {
  user: ApplicationUser;
  applicationId?: string;
}): Promise<PortalDashboardViewModel | null> {
  const data = await loadPortalApplicationData(params);

  if (!data) {
    return null;
  }
  const mappedActions = mapActions({
    canSeePayments: data.canSeePayments,
    actions: data.requiredActions,
  }).map((action) => ({
    ...action,
    href: withApplicationId(action.href, data.applicationRecord.id),
  }));
  const checklistSummary = countChecklistStatuses(data.rawChecklist);
  const currentAgreements =
    data.applications.find((application) => application.id === data.applicationRecord.id)?.agreements ?? [];
  const agreementHref = resolveAgreementHref({
    applicationId: data.applicationRecord.id,
    agreements: currentAgreements,
  });

  const totalProfileRequired =
    4 +
    (data.context.hasDeceasedFather ? 0 : 3) +
    (data.context.requiresMotherData ? 3 : 0) +
    (data.context.hasDeceasedFather || data.context.hasGuardianProfile ? 3 : 0);
  const profileMissing = data.profile.missingStudentFields.length + data.profile.missingParentFields.length;
  const profileCompleted = Math.max(totalProfileRequired - profileMissing, 0);
  const documentsCompleted = data.rawChecklist.filter((item) =>
    item.status === "UPLOADED" || item.status === "UNDER_REVIEW" || item.status === "APPROVED",
  ).length;
  const documentsIncomplete = checklistSummary.missing + checklistSummary.reupload;
  const paymentCompleted =
    data.canSeePayments && data.paymentSummary.remainingAmountSar <= 0 ? 1 : 0;
  const paymentIncomplete =
    data.canSeePayments && data.paymentSummary.remainingAmountSar > 0 ? 1 : 0;
  const agreementAcceptedCount = currentAgreements.filter((agreement) => {
    const parentAccepted = !agreement.requiresParentAcceptance || agreement.parentAccepted;
    return agreement.studentAccepted && parentAccepted;
  }).length;
  const agreementPendingCount = currentAgreements.length - agreementAcceptedCount;
  const profileDocumentsAgreementsComplete =
    profileMissing === 0 &&
    documentsIncomplete === 0 &&
    currentAgreements.length > 0 &&
    agreementPendingCount <= 0;
  const profileDocumentsAgreementsDetail = [
    profileMissing > 0 ? `حقول ناقصة: ${profileMissing}` : null,
    documentsIncomplete > 0 ? `مستندات تحتاج إجراء: ${documentsIncomplete}` : null,
    currentAgreements.length === 0
      ? "الميثاق غير مسند"
      : agreementPendingCount > 0
        ? `مواثيق غير معتمدة: ${agreementPendingCount}`
        : null,
  ].filter(Boolean).join("، ");

  const cards: PortalDashboardViewModel["cards"] = [
    {
      id: "student-info",
      title: "بيانات الطالب",
      stats: [
        { label: "المكتمل", value: String(profileCompleted) },
        { label: "حقول ناقصة", value: String(profileMissing) },
      ],
      description: data.profile.missingStudentFields.length > 0
        ? "يوجد حقول ناقصة في بيانات الطالب."
        : "بيانات الطالب الأساسية مكتملة حالياً.",
      statusLabel: data.applicationRecord.studentInfoLocked
        ? "القسم مقفل"
        : profileMissing > 0
          ? `حقول ناقصة: ${profileMissing}`
          : "لا توجد نواقص",
      statusTone: data.applicationRecord.studentInfoLocked ? "neutral" : profileMissing > 0 ? "warning" : "success",
      href: withApplicationId("/portal/profile", data.applicationRecord.id),
      ctaLabel: data.profile.missingStudentFields.length > 0 ? "إكمال" : "عرض",
    },
    {
      id: "parent-info",
      title: "بيانات الأسرة",
      description:
        data.profile.missingParentFields.length > 0
          ? "بعض بيانات الأسرة تحتاج استكمال أو مراجعة."
          : "بيانات الأسرة المرتبطة بالطلب ظاهرة هنا.",
      stats: [
        { label: "المكتمل", value: String(Math.max(data.applicationRecord.parentProfiles.length - data.profile.missingParentFields.length, 0)) },
        { label: "حقول ناقصة", value: String(data.profile.missingParentFields.length) },
      ],
      statusLabel:
        data.profile.missingParentFields.length > 0
          ? `حقول ناقصة: ${data.profile.missingParentFields.length}`
          : "لا توجد نواقص",
      statusTone: data.profile.missingParentFields.length > 0 ? "warning" : "success",
      href: withApplicationId("/portal/profile", data.applicationRecord.id),
      ctaLabel: data.profile.missingParentFields.length > 0 ? "متابعة" : "عرض",
    },
    {
      id: "documents",
      title: "المستندات",
      description:
        checklistSummary.missing > 0 || checklistSummary.reupload > 0
          ? "هناك مستندات ناقصة أو تحتاج إعادة رفع."
          : "كل المستندات المطلوبة مرفوعة أو قيد المراجعة.",
      stats: [
        { label: "المكتمل", value: String(documentsCompleted) },
        { label: "تحتاج إجراء", value: String(documentsIncomplete) },
      ],
      statusLabel:
        documentsIncomplete > 0
          ? `مستندات تحتاج إجراء: ${documentsIncomplete}`
          : "لا توجد نواقص",
      statusTone: documentsIncomplete > 0 ? "warning" : "success",
      href: withApplicationId("/portal/documents", data.applicationRecord.id),
      ctaLabel: checklistSummary.missing > 0 || checklistSummary.reupload > 0 ? "إكمال" : "عرض",
    },
  ];

  if (data.canSeePayments) {
    cards.push({
      id: "payments",
      title: "المدفوعات",
      description: data.paymentSummary.remainingAmountSar > 0
        ? "يوجد مبلغ متبقٍ أو إيصالات تحتاج متابعة."
        : "الرسوم والدفعات الرسمية محدثة حاليًا.",
      stats: [
        { label: "مكتمل", value: String(paymentCompleted) },
        { label: "دفعات مطلوبة", value: String(paymentIncomplete) },
        { label: "المتبقي", value: `${data.paymentSummary.remainingAmountSar} ر.س` },
      ],
      statusLabel:
        data.paymentSummary.remainingAmountSar > 0
          ? `متبقي: ${data.paymentSummary.remainingAmountSar} ر.س`
          : "لا يوجد متبقي",
      statusTone: data.paymentSummary.remainingAmountSar > 0 ? "warning" : "success",
      href: withApplicationId("/portal/payments", data.applicationRecord.id),
      ctaLabel: data.paymentSummary.remainingAmountSar > 0 ? "متابعة" : "عرض",
    });
  }

  cards.push({
    id: "messages",
    title: "الرسائل",
    description:
      data.unreadMessagesCount > 0
        ? "هناك رسائل جديدة من الإدارة تحتاج الاطلاع."
        : "يمكنك مراسلة الإدارة بخصوص الطلب من هنا.",
    stats: [
      { label: "المكتمل", value: String(data.unreadMessagesCount === 0 ? 1 : 0) },
      { label: "يحتاج متابعة", value: String(data.unreadMessagesCount > 0 ? 1 : 0) },
      { label: "غير المقروء", value: String(data.unreadMessagesCount) },
    ],
    statusLabel: data.unreadMessagesCount > 0 ? "توجد رسائل جديدة" : "لا توجد رسائل جديدة",
    statusTone: data.unreadMessagesCount > 0 ? "warning" : "neutral",
    href: withApplicationId("/portal/messages", data.applicationRecord.id),
    ctaLabel: data.unreadMessagesCount > 0 ? "متابعة" : "عرض",
  });

  cards.push({
    id: "agreements",
    title: "الميثاق",
    description:
      currentAgreements.length === 0
        ? "لا يوجد ميثاق مسند لهذا الطلب حالياً."
        : agreementPendingCount > 0
        ? "توجد مواثيق بحاجة إلى مراجعة أو اعتماد."
        : "كل المواثيق المطلوبة معتمدة حاليًا.",
    stats: [
      { label: "المكتمل", value: String(agreementAcceptedCount) },
      {
        label: currentAgreements.length === 0 ? "غير مسند" : "غير معتمد",
        value: String(currentAgreements.length === 0 ? 1 : Math.max(agreementPendingCount, 0)),
      },
    ],
    statusLabel:
      currentAgreements.length === 0
        ? "لا يوجد ميثاق مسند"
        : agreementPendingCount > 0
          ? `مواثيق غير معتمدة: ${agreementPendingCount}`
          : "كل المواثيق معتمدة",
    statusTone:
      currentAgreements.length === 0 || agreementPendingCount > 0 ? "warning" : "success",
    href: agreementHref,
    ctaLabel:
      currentAgreements.length === 0 ? "عرض" : agreementPendingCount > 0 ? "فتح الميثاق" : "عرض",
  });

  return {
    role: params.user.role as "STUDENT" | "PARENT",
    mobileNumber: params.user.mobileNumber,
    status: data.applicationRecord.status,
    overallCompletion: {
      percent: data.overallCompletionPercent,
      label:
        data.overallCompletionPercent === 100
          ? "البيانات والمستندات والميثاق مكتملة"
          : "متابعة البيانات والمستندات والميثاق",
      tone: data.overallCompletionPercent === 100 ? "complete" : "incomplete",
    },
    studentName: data.applicationRecord.studentProfile?.fullNameAr ?? "طالب بدون اسم",
    completionPercent: data.overallCompletionPercent,
    latestAdminNote: data.latestAdminNote,
    nextStep: buildNextStep({
      actions: mappedActions,
      canSeePayments: data.canSeePayments,
    }),
    progressIndicators: {
      profileDocumentsAgreements: {
        label: "البيانات + المستندات + المواثيق",
        statusLabel: `${data.overallCompletionPercent}%`,
        detailLabel: profileDocumentsAgreementsDetail || "لا توجد نواقص",
        tone: profileDocumentsAgreementsComplete ? "success" : "warning",
      },
      payments: data.canSeePayments
        ? {
            label: "المدفوعات",
            statusLabel: `${data.paymentCompletionPercent}%`,
            detailLabel:
              data.paymentSummary.remainingAmountSar > 0
                ? `متبقي: ${data.paymentSummary.remainingAmountSar} ر.س`
                : "لا يوجد متبقي",
            tone: data.paymentSummary.remainingAmountSar > 0 ? "warning" : "success",
          }
        : undefined,
      messages: {
        label: "الرسائل",
        unreadCount: data.unreadMessagesCount,
      },
    },
    actions: mappedActions,
    cards,
    sectionSummaries: cards.map((card) => ({
      id: card.id,
      title: card.title,
      statusLabel: card.statusLabel ?? "قيد المتابعة",
      tone: card.statusTone ?? "neutral",
      href: card.href,
    })),
    navItems: buildPortalNavItems({
      activeKey: "dashboard",
      canSeePayments: data.canSeePayments,
      applicationId: data.applicationRecord.id,
      agreements: currentAgreements,
    }),
    applicationOptions: data.applications.map((application) => ({
      id: application.id,
      label: application.studentProfile?.fullNameAr ?? "طلب بدون اسم",
    })),
    selectedApplicationId: data.applicationRecord.id,
    activeUserLabel: params.user.role === UserRole.STUDENT ? "طالب" : "ولي أمر",
  };
}
