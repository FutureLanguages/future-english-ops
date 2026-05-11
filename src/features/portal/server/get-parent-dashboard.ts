import { UserRole } from "@prisma/client";
import { smallFinancialDifferenceFeeTitle } from "@/features/payments/constants";
import { portalModeLabels } from "@/features/portal/server/portal-config";
import type {
  ParentDashboardViewModel,
  ParentReassuranceState,
  PortalActionView,
  PortalDashboardBaseViewModel,
  PortalParentFinanceSnapshot,
} from "@/types/portal";
import type { loadPortalApplicationData } from "./load-portal-application";

type PortalApplicationData = NonNullable<Awaited<ReturnType<typeof loadPortalApplicationData>>>;
type SelectedApplication = PortalApplicationData["applications"][number];

function toNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function withApplicationId(href: string, applicationId: string) {
  return href.includes("?")
    ? `${href}&applicationId=${applicationId}`
    : `${href}?applicationId=${applicationId}`;
}

function getSelectedApplication(data: PortalApplicationData): SelectedApplication | undefined {
  return data.applications.find((application) => application.id === data.applicationRecord.id);
}

function getModeLabel(application: SelectedApplication) {
  return portalModeLabels[application.portalConfig?.mode ?? "GENERAL_STUDY"];
}

function buildApplicationOptions(data: PortalApplicationData) {
  return data.applications.map((application) => ({
    id: application.id,
    label: `${application.studentProfile?.fullNameAr ?? "طلب بدون اسم"} — ${getModeLabel(application)}`,
  }));
}

function buildParentFinanceSnapshot(data: PortalApplicationData): PortalParentFinanceSnapshot | null {
  if (!data.canSeePayments) {
    return null;
  }

  const selectedApplication = getSelectedApplication(data);
  const fees = selectedApplication?.fees ?? [];
  const visibleFees = fees.filter((fee) => fee.title !== smallFinancialDifferenceFeeTitle);
  const positiveFeesTotal = visibleFees.reduce((sum, fee) => {
    const amount = toNumber(fee.amount);
    return amount > 0 ? sum + amount : sum;
  }, 0);
  const discountFees = visibleFees.filter((fee) => toNumber(fee.amount) < 0);
  const discountAmountSar = Number(
    Math.abs(discountFees.reduce((sum, fee) => sum + toNumber(fee.amount), 0)).toFixed(2),
  );

  return {
    originalTotalCostSar: Number(positiveFeesTotal.toFixed(2)),
    totalCostSar: data.paymentSummary.totalCostSar,
    paidAmountSar: data.paymentSummary.paidAmountSar,
    remainingAmountSar: data.paymentSummary.remainingAmountSar,
    isPaymentComplete: data.paymentSummary.isPaymentComplete,
    paymentsHref: withApplicationId("/portal/payments", data.applicationRecord.id),
    ...(discountAmountSar > 0
      ? {
          discount: {
            title: discountFees.length === 1 ? discountFees[0].title : "إجمالي الخصومات",
            discountType: discountFees.some((fee) => fee.title.includes("%")) ? "PERCENTAGE" as const : "FIXED" as const,
            amountSar: discountAmountSar,
          },
        }
      : {}),
  };
}

function actionCtaLabel(action: PortalActionView) {
  if (action.section === "documents") return "مراجعة المستندات";
  if (action.section === "payments") return "مراجعة المدفوعات";
  if (action.section === "agreements") return "مراجعة الميثاق";
  if (action.section === "messages") return "مراجعة الرسائل";
  if (action.section === "student_info" || action.section === "parent_info") return "مراجعة البيانات";
  return "مراجعة الإجراء";
}

function buildReassurance(params: {
  state: ParentReassuranceState;
  primaryAction: PortalActionView | null;
  suppressActionFraming: boolean;
}): ParentDashboardViewModel["reassurance"] {
  const { primaryAction, state, suppressActionFraming } = params;
  const action = !suppressActionFraming && primaryAction?.href
    ? { label: actionCtaLabel(primaryAction), href: primaryAction.href }
    : undefined;

  if (state === "NEEDS_ATTENTION") {
    return {
      tone: "warning",
      title: "يوجد أمر يحتاج انتباهكم",
      description: primaryAction?.description ?? "هناك مستند أو إيصال يحتاج مراجعة حتى لا يتعطل تقدم الطلب.",
      primaryAction: action,
      badgeLabel: "يحتاج متابعة",
    };
  }

  if (state === "ACTION_REQUIRED") {
    return {
      tone: "action",
      title: "يوجد إجراء مطلوب منكم",
      description: primaryAction?.description ?? "هناك خطوة مباشرة من ولي الأمر تساعد على تقدم الطلب بدون تأخير.",
      primaryAction: action,
      badgeLabel: "إجراء مطلوب",
    };
  }

  if (state === "WAITING") {
    return {
      tone: "review",
      title: "الطلب قيد المتابعة",
      description: "لا يوجد إجراء مطلوب منكم حالياً، والطلب لدى الإدارة أو تحت المراجعة.",
      badgeLabel: "قيد المراجعة",
    };
  }

  return {
    tone: "calm",
    title: "الأمور مستقرة حالياً",
    description: "لا يوجد تدخل مطلوب من ولي الأمر الآن. سنعرض أي إجراء جديد هنا بوضوح.",
    badgeLabel: "لا يوجد إجراء",
  };
}

export function buildParentDashboardViewModel(params: {
  data: PortalApplicationData;
  base: PortalDashboardBaseViewModel;
  reassuranceState: ParentReassuranceState;
}): ParentDashboardViewModel {
  const { base, data, reassuranceState } = params;
  const suppressActionFraming = base.statusBehavior.suppressActionFraming;
  const requiredIntervention = suppressActionFraming
    ? null
    : base.actions.find((action) => action.section !== "messages") ?? null;

  return {
    ...base,
    role: "PARENT",
    dashboardKind: "parent",
    applicationOptions: buildApplicationOptions(data),
    reassuranceState,
    reassurance: buildReassurance({
      state: reassuranceState,
      primaryAction: requiredIntervention,
      suppressActionFraming,
    }),
    hasPendingActions: suppressActionFraming ? false : base.actions.length > 0,
    progressPercent: base.stage.progressPercent,
    requiredIntervention,
    heroPrimaryAction: {
      label: base.nextStep.ctaLabel ?? "مراجعة الحالة",
      href: suppressActionFraming ? undefined : base.nextStep.href,
    },
    financeSnapshot: buildParentFinanceSnapshot(data),
    activeUserLabel: data.user.role === UserRole.PARENT ? "ولي أمر" : base.activeUserLabel,
  };
}
