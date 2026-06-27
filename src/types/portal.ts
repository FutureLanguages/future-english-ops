import type { ApplicationStatus, PortalMode } from "@prisma/client";

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
  documentRequirementCode?: string;
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

export type PortalParentFinanceSnapshot = PortalFinanceSnapshot & {
  originalTotalCostSar: number;
  paymentsHref: string;
  discount?: {
    title: string;
    discountType: "FIXED" | "PERCENTAGE";
    amountSar: number;
  };
};

export type PortalSectionHealthSummary = Array<{
  id: string;
  title: string;
  statusLabel: string;
  detailLabel: string;
  tone: "success" | "warning" | "neutral";
  href?: string;
}>;

export type PortalStageId =
  | "registration"
  | "profile"
  | "documents"
  | "agreement"
  | "payment"
  | "closure";

export type PortalStageStatus = "completed" | "current" | "upcoming";

export type PortalStageItem = {
  id: PortalStageId;
  label: string;
  index: number;
  status: PortalStageStatus;
};

export type PortalStageModel = {
  currentStageId: PortalStageId;
  currentStageIndex: number;
  currentStageLabel: string;
  progressPercent: number;
  timelineActive: boolean;
  stages: PortalStageItem[];
};

export type PortalStatusBehaviorCode =
  | "DRAFT"
  | "IN_PROGRESS"
  | "REVIEWING"
  | "PENDING_PAYMENT"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PortalStatusBehavior = {
  code: PortalStatusBehaviorCode;
  label: string;
  tone: "neutral" | "active" | "waiting" | "success" | "warning" | "danger";
  isTerminal: boolean;
  suppressActionFraming: boolean;
  studentHeroTitle: string;
  studentHeroDescription: string;
  parentHeroTitle: string;
  parentHeroDescription: string;
};

export type PortalProgramSurfaceItem = {
  key:
    | "showCountdown"
    | "showTripDetails"
    | "showFlightInfo"
    | "showSupervisorInfo"
    | "showProgramEvents"
    | "showEnrollmentCard"
    | "showPaymentSchedule";
  label: string;
  enabled: boolean;
  renderable: boolean;
  supportLabel: string;
};

export type PortalProgramConfigView = {
  mode: PortalMode;
  modeLabel: string;
  surfaces: Record<PortalProgramSurfaceItem["key"], boolean>;
  items: PortalProgramSurfaceItem[];
};

export type PortalStudyPlanView = {
  instituteName: string | null;
  instituteBranch: string | null;
  country: string | null;
  city: string | null;
  programName: string | null;
  programStartDate: Date | null;
  programEndDate: Date | null;
  housingType: string | null;
  roomType: string | null;
  housingNotes: string | null;
  departureDate: Date | null;
  arrivalDate: Date | null;
  airlineName: string | null;
  flightNumber: string | null;
};

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
  stage: PortalStageModel;
  statusBehavior: PortalStatusBehavior;
  program: PortalProgramConfigView;
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
  studyPlan: PortalStudyPlanView | null;
};

export type ParentReassuranceState =
  | "ALL_GOOD"
  | "ACTION_REQUIRED"
  | "WAITING"
  | "NEEDS_ATTENTION";

export type ParentDashboardViewModel = PortalDashboardBaseViewModel & {
  role: "PARENT";
  dashboardKind: "parent";
  reassurance: {
    tone: "calm" | "action" | "review" | "warning";
    title: string;
    description: string;
    primaryAction?: {
      label: string;
      href: string;
    };
    badgeLabel: string;
  };
  reassuranceState: ParentReassuranceState;
  hasPendingActions: boolean;
  progressPercent: number;
  requiredIntervention: PortalActionView | null;
  heroPrimaryAction: {
    label: string;
    href?: string;
  };
  financeSnapshot: PortalParentFinanceSnapshot | null;
};

export type PortalDashboardViewModel = StudentDashboardViewModel | ParentDashboardViewModel;
