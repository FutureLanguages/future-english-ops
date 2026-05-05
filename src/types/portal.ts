import type { ApplicationStatus } from "@prisma/client";

export type PortalNavItem = {
  key: string;
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  devOnlyLabel?: string;
};

export type PortalActionView = {
  id: string;
  label: string;
  description?: string;
  section: "student_info" | "parent_info" | "documents" | "payments" | "agreements" | "messages" | "info";
  href?: string;
  tone: "critical" | "warning" | "neutral";
  priority?: number;
};

export type PortalSectionCard = {
  id: string;
  title: string;
  description: string;
  statusLabel?: string;
  statusTone?: "success" | "warning" | "neutral";
  stats: Array<{
    label: string;
    value: string;
  }>;
  href?: string;
  ctaLabel?: string;
  disabledLabel?: string;
};

export type PortalDevUserOption = {
  id: string;
  role: "STUDENT" | "PARENT";
  mobileNumber: string;
  label: string;
};

export type PortalFinanceSnapshot = {
  totalCostSar: number;
  paidAmountSar: number;
  remainingAmountSar: number;
  isPaymentComplete: boolean;
};

export type PortalSectionHealthSummary = Array<{
  id: string;
  title: string;
  statusLabel: string;
  detailLabel: string;
  tone: "success" | "warning" | "neutral";
  href?: string;
}>;

export type PortalDashboardBaseViewModel = {
  role: "STUDENT" | "PARENT";
  mobileNumber: string;
  status: ApplicationStatus;
  statusLabel: string;
  statusContext: string;
  overallCompletion: {
    percent: number;
    label: string;
    tone: "complete" | "incomplete";
  };
  studentName: string;
  completionPercent: number;
  latestAdminNote: string | null;
  currentStage: string;
  stageLabel: string;
  nextStep: {
    title: string;
    description: string;
    href?: string;
    ctaLabel?: string;
  };
  progressIndicators: {
    profileDocumentsAgreements: {
      label: string;
      statusLabel: string;
      detailLabel: string;
      tone: "success" | "warning";
    };
    payments?: {
      label: string;
      statusLabel: string;
      detailLabel: string;
      tone: "success" | "warning";
    };
    messages: {
      label: string;
      unreadCount: number;
    };
  };
  actions: PortalActionView[];
  topActions: PortalActionView[];
  remainingActionsCount: number;
  cards: PortalSectionCard[];
  sectionSummaries: PortalSectionHealthSummary;
  navItems: PortalNavItem[];
  applicationOptions: Array<{
    id: string;
    label: string;
  }>;
  selectedApplicationId: string;
  activeUserLabel: string;
};

export type StudentDashboardViewModel = PortalDashboardBaseViewModel & {
  role: "STUDENT";
  dashboardKind: "student";
  heroPrimaryAction: {
    label: string;
    href?: string;
  };
  financeSnapshot?: PortalFinanceSnapshot | null;
};

export type ParentReassuranceState =
  | "ALL_GOOD"
  | "ACTION_REQUIRED"
  | "WAITING"
  | "NEEDS_ATTENTION";

export type ParentDashboardViewModel = PortalDashboardBaseViewModel & {
  role: "PARENT";
  dashboardKind: "parent";
  reassuranceState: ParentReassuranceState;
  hasPendingActions: boolean;
  requiredIntervention: PortalActionView | null;
  heroPrimaryAction: {
    label: string;
    href?: string;
  };
  financeSnapshot: PortalFinanceSnapshot;
};

export type PortalDashboardViewModel = StudentDashboardViewModel | ParentDashboardViewModel;
