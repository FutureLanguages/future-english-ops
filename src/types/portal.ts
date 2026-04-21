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
  section: "student_info" | "parent_info" | "documents" | "payments" | "info";
  href?: string;
  tone: "critical" | "warning" | "neutral";
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

export type PortalDashboardViewModel = {
  role: "STUDENT" | "PARENT";
  mobileNumber: string;
  status: ApplicationStatus;
  overallCompletion: {
    percent: number;
    label: string;
    tone: "complete" | "incomplete";
  };
  studentName: string;
  completionPercent: number;
  latestAdminNote: string | null;
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
  cards: PortalSectionCard[];
  sectionSummaries: Array<{
    id: string;
    title: string;
    statusLabel: string;
    tone: "success" | "warning" | "neutral";
    href?: string;
  }>;
  navItems: PortalNavItem[];
  applicationOptions: Array<{
    id: string;
    label: string;
  }>;
  selectedApplicationId: string;
  activeUserLabel: string;
};
