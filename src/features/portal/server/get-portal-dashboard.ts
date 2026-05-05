import { ApplicationStatus, DocumentStatus, UserRole } from "@prisma/client";
import type { ApplicationUser } from "@/types/application";
import type {
  ParentDashboardViewModel,
  ParentReassuranceState,
  PortalActionView,
  PortalDashboardBaseViewModel,
  PortalDashboardViewModel,
  PortalFinanceSnapshot,
  PortalProgramConfigView,
  PortalSectionCard,
  PortalSectionHealthSummary,
  StudentDashboardViewModel,
} from "@/types/portal";
import { derivePortalStageStatus } from "./derive-portal-stage-status";
import { loadPortalApplicationData } from "./load-portal-application";
import { buildPortalNavItems, resolveAgreementHref } from "./nav";
import { portalModeLabels, resolvePortalSurfaces } from "./portal-config";

type PortalApplicationData = NonNullable<Awaited<ReturnType<typeof loadPortalApplicationData>>>;
type SelectedApplication = PortalApplicationData["applications"][number];

function withApplicationId(href: string | undefined, applicationId: string) {
  if (!href) {
    return undefined;
  }

  return href.includes("?")
    ? `${href}&applicationId=${applicationId}`
    : `${href}?applicationId=${applicationId}`;
}

function getCurrentAgreements(data: PortalApplicationData) {
  return data.applications.find((application) => application.id === data.applicationRecord.id)?.agreements ?? [];
}

function getSelectedApplication(data: PortalApplicationData): SelectedApplication | undefined {
  return data.applications.find((application) => application.id === data.applicationRecord.id);
}

function getFinanceSnapshot(data: PortalApplicationData): PortalFinanceSnapshot {
  return {
    totalCostSar: data.paymentSummary.totalCostSar,
    paidAmountSar: data.paymentSummary.paidAmountSar,
    remainingAmountSar: data.paymentSummary.remainingAmountSar,
    isPaymentComplete: data.paymentSummary.isPaymentComplete,
  };
}

function getProgramConfigView(data: PortalApplicationData): PortalProgramConfigView {
  const selectedApplication = getSelectedApplication(data);
  const resolution = resolvePortalSurfaces({
    mode: selectedApplication?.portalConfig?.mode,
    overrides: selectedApplication?.portalConfig ?? null,
  });

  return {
    mode: resolution.mode,
    modeLabel: portalModeLabels[resolution.mode],
    surfaces: resolution.surfaces,
    items: resolution.items.map((item) => ({
      key: item.key,
      label: item.label,
      enabled: item.enabled,
      renderable: item.renderable,
      supportLabel: item.supportLabel,
    })),
  };
}

function countChecklistStatuses(
  checklist: Array<{
    status: DocumentStatus;
  }>,
) {
  return checklist.reduce(
    (summary, item) => {
      if (item.status === DocumentStatus.MISSING) {
        summary.missing += 1;
      }

      if (item.status === DocumentStatus.REJECTED || item.status === DocumentStatus.REUPLOAD_REQUESTED) {
        summary.reupload += 1;
      }

      if (
        item.status === DocumentStatus.UPLOADED ||
        item.status === DocumentStatus.UNDER_REVIEW ||
        item.status === DocumentStatus.APPROVED
      ) {
        summary.completed += 1;
      }

      return summary;
    },
    { missing: 0, reupload: 0, completed: 0 },
  );
}

function toneFromPriority(priority: number): PortalActionView["tone"] {
  if (priority <= 20) {
    return "critical";
  }

  if (priority <= 50) {
    return "warning";
  }

  return "neutral";
}

function actionHref(section: PortalActionView["section"]) {
  if (section === "documents") return "/portal/documents";
  if (section === "payments") return "/portal/payments";
  if (section === "agreements") return "/portal/agreements";
  if (section === "messages") return "/portal/messages";
  if (section === "student_info" || section === "parent_info") return "/portal/profile";
  return undefined;
}

export function buildPortalRequiredActions(data: PortalApplicationData): PortalActionView[] {
  const selectedApplication = getSelectedApplication(data);
  const actions: PortalActionView[] = [];

  const addAction = (action: Omit<PortalActionView, "tone" | "href"> & { href?: string }) => {
    actions.push({
      ...action,
      href: withApplicationId(action.href ?? actionHref(action.section), data.applicationRecord.id),
      tone: toneFromPriority(action.priority ?? 90),
    });
  };

  const problematicReceipt = selectedApplication?.paymentReceipts.find(
    (receipt) =>
      receipt.status === DocumentStatus.REJECTED ||
      receipt.status === DocumentStatus.REUPLOAD_REQUESTED,
  );

  if (problematicReceipt) {
    addAction({
      id: `receipt-${problematicReceipt.id}`,
      label: problematicReceipt.status === DocumentStatus.REJECTED ? "إيصال دفع مرفوض" : "مطلوب إعادة رفع إيصال الدفع",
      description: problematicReceipt.adminNote ?? "راجع قسم المدفوعات لمعرفة الإجراء المطلوب.",
      section: data.canSeePayments ? "payments" : "info",
      priority: 10,
    });
  }

  if (data.paymentSummary.hasOutstandingPayment) {
    addAction({
      id: "payment-outstanding",
      label: data.canSeePayments ? "استكمال المبلغ المتبقي" : "هناك إجراء مالي مطلوب من ولي الأمر",
      description: data.canSeePayments
        ? `المتبقي الحالي ${data.paymentSummary.remainingAmountSar} ر.س.`
        : "لا تظهر تفاصيل المدفوعات لهذا الحساب حالياً.",
      section: data.canSeePayments ? "payments" : "info",
      priority: 15,
    });
  }

  for (const agreement of getCurrentAgreements(data)) {
    const studentNeedsSignature =
      data.user.role === UserRole.STUDENT &&
      agreement.requiresStudentAcceptance &&
      !agreement.studentAccepted;
    const parentNeedsSignature =
      data.user.role === UserRole.PARENT &&
      agreement.requiresParentAcceptance &&
      !agreement.parentAccepted;

    if (studentNeedsSignature || parentNeedsSignature) {
      addAction({
        id: `agreement-${agreement.id}`,
        label: `اعتماد ${agreement.title}`,
        description: "الميثاق يحتاج مراجعة وتوقيعاً من هذا الحساب.",
        section: "agreements",
        href: `/portal/agreements/${agreement.id}`,
        priority: 20,
      });
    }
  }

  for (const document of data.rawChecklist) {
    if (document.status === DocumentStatus.REJECTED || document.status === DocumentStatus.REUPLOAD_REQUESTED) {
      addAction({
        id: `document-reupload-${document.code}`,
        label: `إعادة رفع ${document.titleAr}`,
        description: "المستند يحتاج تعديل أو إعادة رفع قبل اعتماده.",
        section: "documents",
        priority: 30,
      });
    }
  }

  for (const document of data.rawChecklist) {
    if (document.status === DocumentStatus.MISSING) {
      addAction({
        id: `document-missing-${document.code}`,
        label: `رفع ${document.titleAr}`,
        description: "هذا المستند مطلوب لاستكمال الطلب.",
        section: "documents",
        priority: 40,
      });
    }
  }

  if (data.unreadMessagesCount > 0) {
    addAction({
      id: "unread-admin-message",
      label: `رسائل غير مقروءة: ${data.unreadMessagesCount}`,
      description: "اطلع على رسائل الإدارة للتأكد من عدم وجود توجيه مهم.",
      section: "messages",
      priority: 50,
    });
  }

  for (const field of data.profile.missingStudentFields) {
    addAction({
      id: `student-field-${field.field}`,
      label: `استكمال ${field.label}`,
      description: "بيانات الطالب تساعد الإدارة على متابعة الطلب بدقة.",
      section: "student_info",
      priority: 60,
    });
  }

  for (const field of data.profile.missingParentFields) {
    addAction({
      id: `parent-field-${field.parentType}-${field.field}`,
      label: `استكمال ${field.label}`,
      description: "هذه البيانات مطلوبة لاستكمال ملف الأسرة.",
      section: "parent_info",
      priority: 60,
    });
  }

  return actions.sort((left, right) => {
    if ((left.priority ?? 90) !== (right.priority ?? 90)) {
      return (left.priority ?? 90) - (right.priority ?? 90);
    }

    return left.label.localeCompare(right.label, "ar");
  });
}

function buildNextStep(params: {
  actions: PortalActionView[];
  role: UserRole;
  statusBehavior: ReturnType<typeof derivePortalStageStatus>["statusBehavior"];
}) {
  if (params.statusBehavior.isTerminal) {
    return {
      title: params.statusBehavior.label,
      description:
        params.role === UserRole.STUDENT
          ? params.statusBehavior.studentHeroDescription
          : params.statusBehavior.parentHeroDescription,
    };
  }

  if (params.statusBehavior.suppressActionFraming && params.actions.length === 0) {
    return {
      title: params.statusBehavior.label,
      description:
        params.role === UserRole.STUDENT
          ? params.statusBehavior.studentHeroDescription
          : params.statusBehavior.parentHeroDescription,
    };
  }

  const actions = params.actions;
  const role = params.role;
  const firstAction = actions[0];

  if (!firstAction) {
    return {
      title: role === UserRole.STUDENT ? params.statusBehavior.studentHeroTitle : params.statusBehavior.parentHeroTitle,
      description:
        role === UserRole.STUDENT
          ? params.statusBehavior.studentHeroDescription
          : params.statusBehavior.parentHeroDescription,
    };
  }

  return {
    title: role === UserRole.STUDENT ? `خطوتك التالية: ${firstAction.label}` : `التدخل المطلوب: ${firstAction.label}`,
    description:
      firstAction.description ??
      (role === UserRole.STUDENT
        ? "ابدأ بهذا الإجراء لأنه الأكثر تأثيراً على تقدم الطلب الآن."
        : "هذا هو الإجراء الأهم حالياً لمساعدة الطلب على التقدم بدون تأخير."),
    href: firstAction.href,
    ctaLabel: firstAction.href ? (role === UserRole.STUDENT ? "ابدأ الآن" : "متابعة الإجراء") : undefined,
  };
}

function buildCards(params: {
  data: PortalApplicationData;
  actions: PortalActionView[];
  currentAgreements: SelectedApplication["agreements"];
}) {
  const { data, currentAgreements } = params;
  const checklistSummary = countChecklistStatuses(data.rawChecklist);
  const agreementHref = resolveAgreementHref({
    applicationId: data.applicationRecord.id,
    agreements: currentAgreements,
  });
  const agreementAcceptedCount = currentAgreements.filter((agreement) => {
    const studentAccepted = !agreement.requiresStudentAcceptance || agreement.studentAccepted;
    const parentAccepted = !agreement.requiresParentAcceptance || agreement.parentAccepted;
    return studentAccepted && parentAccepted;
  }).length;
  const agreementPendingCount = currentAgreements.length - agreementAcceptedCount;
  const profileMissing = data.profile.missingStudentFields.length + data.profile.missingParentFields.length;
  const documentsIncomplete = checklistSummary.missing + checklistSummary.reupload;

  const cards: PortalSectionCard[] = [
    {
      id: "profile",
      title: "البيانات",
      description:
        profileMissing > 0
          ? "توجد بيانات تحتاج استكمال حتى يصبح الملف أوضح للإدارة."
          : "بيانات الطالب والأسرة مكتملة حالياً.",
      stats: [
        { label: "حقول ناقصة", value: String(profileMissing) },
        { label: "اكتمال البيانات", value: `${data.profile.completionPercent}%` },
      ],
      statusLabel: profileMissing > 0 ? `حقول ناقصة: ${profileMissing}` : "لا توجد نواقص",
      statusTone: profileMissing > 0 ? "warning" : "success",
      href: withApplicationId("/portal/profile", data.applicationRecord.id),
      ctaLabel: profileMissing > 0 ? "استكمال البيانات" : "عرض البيانات",
    },
    {
      id: "documents",
      title: "المستندات",
      description:
        documentsIncomplete > 0
          ? "هناك مستندات ناقصة أو تحتاج إعادة رفع."
          : "المستندات المطلوبة مرفوعة أو قيد الاعتماد.",
      stats: [
        { label: "مكتمل/مرفوع", value: String(checklistSummary.completed) },
        { label: "تحتاج إجراء", value: String(documentsIncomplete) },
      ],
      statusLabel: documentsIncomplete > 0 ? `مستندات تحتاج إجراء: ${documentsIncomplete}` : "لا توجد نواقص",
      statusTone: documentsIncomplete > 0 ? "warning" : "success",
      href: withApplicationId("/portal/documents", data.applicationRecord.id),
      ctaLabel: documentsIncomplete > 0 ? "متابعة المستندات" : "عرض المستندات",
    },
    {
      id: "agreements",
      title: "الميثاق",
      description:
        currentAgreements.length === 0
          ? "لا يوجد ميثاق مسند لهذا الطلب حالياً."
          : agreementPendingCount > 0
            ? "يوجد ميثاق يحتاج اعتماداً من الحساب المعني."
            : "كل المواثيق المطلوبة معتمدة حالياً.",
      stats: [
        { label: "معتمد", value: String(agreementAcceptedCount) },
        { label: currentAgreements.length === 0 ? "غير مسند" : "غير معتمد", value: String(currentAgreements.length === 0 ? 1 : agreementPendingCount) },
      ],
      statusLabel:
        currentAgreements.length === 0
          ? "الميثاق غير مسند"
          : agreementPendingCount > 0
            ? `مواثيق غير معتمدة: ${agreementPendingCount}`
            : "كل المواثيق معتمدة",
      statusTone: currentAgreements.length === 0 || agreementPendingCount > 0 ? "warning" : "success",
      href: agreementHref,
      ctaLabel: agreementPendingCount > 0 ? "فتح الميثاق" : "عرض الميثاق",
    },
    {
      id: "messages",
      title: "الرسائل",
      description:
        data.unreadMessagesCount > 0
          ? "توجد رسائل جديدة من الإدارة تحتاج الاطلاع."
          : "لا توجد رسائل غير مقروءة حالياً.",
      stats: [
        { label: "غير مقروءة", value: String(data.unreadMessagesCount) },
        { label: "الحالة", value: data.unreadMessagesCount > 0 ? "متابعة" : "واضحة" },
      ],
      statusLabel:
        data.unreadMessagesCount > 0
          ? `رسائل غير مقروءة: ${data.unreadMessagesCount}`
          : "لا توجد رسائل جديدة",
      statusTone: data.unreadMessagesCount > 0 ? "warning" : "neutral",
      href: withApplicationId("/portal/messages", data.applicationRecord.id),
      ctaLabel: "فتح الرسائل",
    },
  ];

  if (data.canSeePayments) {
    cards.splice(2, 0, {
      id: "payments",
      title: "المدفوعات",
      description:
        data.paymentSummary.remainingAmountSar > 0
          ? "يوجد مبلغ متبقٍ يحتاج متابعة."
          : "لا يوجد مبلغ متبقٍ حالياً.",
      stats: [
        { label: "المدفوع", value: `${data.paymentSummary.paidAmountSar} ر.س` },
        { label: "المتبقي", value: `${data.paymentSummary.remainingAmountSar} ر.س` },
      ],
      statusLabel:
        data.paymentSummary.remainingAmountSar > 0
          ? `متبقي: ${data.paymentSummary.remainingAmountSar} ر.س`
          : "لا يوجد متبقي",
      statusTone: data.paymentSummary.remainingAmountSar > 0 ? "warning" : "success",
      href: withApplicationId("/portal/payments", data.applicationRecord.id),
      ctaLabel: data.paymentSummary.remainingAmountSar > 0 ? "متابعة الدفع" : "عرض المدفوعات",
    });
  }

  return cards;
}

function buildSectionSummaries(cards: PortalSectionCard[]): PortalSectionHealthSummary {
  return cards.map((card) => ({
    id: card.id,
    title: card.title,
    statusLabel: card.statusLabel ?? "متابعة",
    detailLabel: card.description,
    tone: card.statusTone ?? "neutral",
    href: card.href,
  }));
}

function buildProgressIndicators(params: {
  data: PortalApplicationData;
  currentAgreements: SelectedApplication["agreements"];
}) {
  const { data, currentAgreements } = params;
  const checklistSummary = countChecklistStatuses(data.rawChecklist);
  const profileMissing = data.profile.missingStudentFields.length + data.profile.missingParentFields.length;
  const documentsIncomplete = checklistSummary.missing + checklistSummary.reupload;
  const agreementAcceptedCount = currentAgreements.filter((agreement) => {
    const studentAccepted = !agreement.requiresStudentAcceptance || agreement.studentAccepted;
    const parentAccepted = !agreement.requiresParentAcceptance || agreement.parentAccepted;
    return studentAccepted && parentAccepted;
  }).length;
  const agreementPendingCount = currentAgreements.length - agreementAcceptedCount;
  const complete =
    profileMissing === 0 &&
    documentsIncomplete === 0 &&
    currentAgreements.length > 0 &&
    agreementPendingCount === 0;
  const detailLabel = [
    profileMissing > 0 ? `حقول ناقصة: ${profileMissing}` : null,
    documentsIncomplete > 0 ? `مستندات تحتاج إجراء: ${documentsIncomplete}` : null,
    currentAgreements.length === 0
      ? "الميثاق غير مسند"
      : agreementPendingCount > 0
        ? `مواثيق غير معتمدة: ${agreementPendingCount}`
        : null,
  ].filter(Boolean).join("، ");

  return {
    profileDocumentsAgreements: {
      label: "البيانات والمستندات والميثاق",
      statusLabel: `${data.overallCompletionPercent}%`,
      detailLabel: detailLabel || "لا توجد نواقص",
      tone: complete ? "success" as const : "warning" as const,
    },
    payments: data.canSeePayments
      ? {
          label: "المدفوعات",
          statusLabel: `${data.paymentCompletionPercent}%`,
          detailLabel:
            data.paymentSummary.remainingAmountSar > 0
              ? `متبقي: ${data.paymentSummary.remainingAmountSar} ر.س`
              : "لا يوجد متبقي",
          tone: data.paymentSummary.remainingAmountSar > 0 ? "warning" as const : "success" as const,
        }
      : undefined,
    messages: {
      label: "الرسائل",
      unreadCount: data.unreadMessagesCount,
    },
  };
}

function buildBaseDashboardViewModel(data: PortalApplicationData): PortalDashboardBaseViewModel {
  const currentAgreements = getCurrentAgreements(data);
  const actions = buildPortalRequiredActions(data);
  const cards = buildCards({ data, actions, currentAgreements });
  const checklistSummary = countChecklistStatuses(data.rawChecklist);
  const profileComplete =
    data.profile.missingStudentFields.length === 0 &&
    data.profile.missingParentFields.length === 0;
  const documentsComplete = checklistSummary.missing === 0 && checklistSummary.reupload === 0;
  const agreementsComplete =
    currentAgreements.length > 0 &&
    currentAgreements.every((agreement) => {
      const studentAccepted = !agreement.requiresStudentAcceptance || agreement.studentAccepted;
      const parentAccepted = !agreement.requiresParentAcceptance || agreement.parentAccepted;
      return studentAccepted && parentAccepted;
    });
  const { stage, statusBehavior } = derivePortalStageStatus({
    applicationStatus: data.applicationRecord.status,
    profileComplete,
    documentsComplete,
    agreementsComplete,
    paymentComplete: data.paymentSummary.isPaymentComplete,
  });
  const topActions = statusBehavior.suppressActionFraming ? [] : actions.slice(0, 3);

  return {
    role: data.user.role as "STUDENT" | "PARENT",
    mobileNumber: data.user.mobileNumber,
    status: data.applicationRecord.status,
    statusLabel: statusBehavior.label,
    statusContext: statusBehavior.studentHeroDescription,
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
    currentStage: stage.currentStageId,
    stageLabel: stage.currentStageLabel,
    stage,
    statusBehavior,
    program: getProgramConfigView(data),
    nextStep: buildNextStep({
      actions,
      role: data.user.role,
      statusBehavior,
    }),
    progressIndicators: buildProgressIndicators({ data, currentAgreements }),
    actions,
    topActions,
    remainingActionsCount: Math.max(actions.length - topActions.length, 0),
    cards,
    sectionSummaries: buildSectionSummaries(cards),
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
    activeUserLabel: data.user.role === UserRole.STUDENT ? "طالب" : "ولي أمر",
  };
}

function deriveParentReassuranceState(params: {
  data: PortalApplicationData;
  actions: PortalActionView[];
  statusBehavior: ReturnType<typeof derivePortalStageStatus>["statusBehavior"];
}): ParentReassuranceState {
  const { data, actions, statusBehavior } = params;

  if (statusBehavior.isTerminal || statusBehavior.code === "READY") {
    return "ALL_GOOD";
  }

  const selectedApplication = getSelectedApplication(data);
  const hasProblemDocument = data.rawChecklist.some(
    (document) =>
      document.status === DocumentStatus.REJECTED ||
      document.status === DocumentStatus.REUPLOAD_REQUESTED,
  );
  const hasProblemReceipt = selectedApplication?.paymentReceipts.some(
    (receipt) =>
      receipt.status === DocumentStatus.REJECTED ||
      receipt.status === DocumentStatus.REUPLOAD_REQUESTED,
  ) ?? false;
  const hasUnderReviewItems =
    data.rawChecklist.some((document) => document.status === DocumentStatus.UNDER_REVIEW || document.status === DocumentStatus.UPLOADED) ||
    (selectedApplication?.paymentReceipts.some((receipt) => receipt.status === DocumentStatus.UNDER_REVIEW || receipt.status === DocumentStatus.UPLOADED) ?? false);

  if (hasProblemDocument || hasProblemReceipt) {
    return "NEEDS_ATTENTION";
  }

  if (actions.some((action) => action.section !== "messages")) {
    return "ACTION_REQUIRED";
  }

  if (hasUnderReviewItems || data.applicationRecord.status === ApplicationStatus.UNDER_REVIEW) {
    return "WAITING";
  }

  return "ALL_GOOD";
}

export async function getStudentDashboardViewModel(params: {
  user: ApplicationUser;
  applicationId?: string;
}): Promise<StudentDashboardViewModel | null> {
  const data = await loadPortalApplicationData(params);

  if (!data) {
    return null;
  }

  const base = buildBaseDashboardViewModel(data);

  return {
    ...base,
    role: "STUDENT",
    dashboardKind: "student",
    heroPrimaryAction: {
      label: base.nextStep.ctaLabel ?? "متابعة الطلب",
      href: base.statusBehavior.suppressActionFraming ? undefined : base.nextStep.href,
    },
    financeSnapshot: data.canSeePayments ? getFinanceSnapshot(data) : null,
  };
}

export async function getParentDashboardViewModel(params: {
  user: ApplicationUser;
  applicationId?: string;
}): Promise<ParentDashboardViewModel | null> {
  const data = await loadPortalApplicationData(params);

  if (!data) {
    return null;
  }

  const base = buildBaseDashboardViewModel(data);
  const reassuranceState = deriveParentReassuranceState({
    data,
    actions: base.actions,
    statusBehavior: base.statusBehavior,
  });

  return {
    ...base,
    role: "PARENT",
    dashboardKind: "parent",
    reassuranceState,
    hasPendingActions: base.statusBehavior.suppressActionFraming ? false : base.actions.length > 0,
    requiredIntervention: base.statusBehavior.suppressActionFraming
      ? null
      : base.actions.find((action) => action.section !== "messages") ?? null,
    heroPrimaryAction: {
      label: base.nextStep.ctaLabel ?? "مراجعة الحالة",
      href: base.statusBehavior.suppressActionFraming ? undefined : base.nextStep.href,
    },
    financeSnapshot: getFinanceSnapshot(data),
  };
}

export async function getPortalDashboardViewModel(params: {
  user: ApplicationUser;
  applicationId?: string;
}): Promise<PortalDashboardViewModel | null> {
  if (params.user.role === UserRole.STUDENT) {
    return getStudentDashboardViewModel(params);
  }

  return getParentDashboardViewModel(params);
}
