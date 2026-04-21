import { UserRole } from "@prisma/client";
import type { ApplicationUser } from "@/types/application";
import type { PortalActionView, PortalNavItem } from "@/types/portal";
import { loadPortalApplicationData } from "./load-portal-application";
import { buildPortalNavItems } from "./nav";

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

export async function getPortalActionsViewModel(params: {
  user: ApplicationUser;
  applicationId?: string;
}): Promise<{
  role: "STUDENT" | "PARENT";
  mobileNumber: string;
  activeUserLabel: string;
  studentName: string;
  status: "NEW" | "INCOMPLETE" | "UNDER_REVIEW" | "WAITING_PAYMENT" | "COMPLETED";
  overallCompletion: {
    percent: number;
    label: string;
    tone: "complete" | "incomplete";
  };
  navItems: PortalNavItem[];
  applicationOptions: Array<{ id: string; label: string }>;
  selectedApplicationId: string;
  actions: PortalActionView[];
} | null> {
  const data = await loadPortalApplicationData(params);

  if (!data) {
    return null;
  }

  return {
    role: data.user.role as "STUDENT" | "PARENT",
    mobileNumber: data.user.mobileNumber,
    activeUserLabel: data.user.role === UserRole.STUDENT ? "طالب" : "ولي أمر",
    studentName: data.applicationRecord.studentProfile?.fullNameAr ?? "طالب بدون اسم",
    status: data.applicationRecord.status,
    overallCompletion: {
      percent: data.overallCompletionPercent,
      label: data.overallCompletionPercent === 100 ? "اكتمال الطلب" : "اكتمال جزئي",
      tone: data.overallCompletionPercent === 100 ? "complete" : "incomplete",
    },
    navItems: buildPortalNavItems({
      activeKey: "dashboard",
      canSeePayments: data.canSeePayments,
      applicationId: data.applicationRecord.id,
      agreements: data.applications.find((application) => application.id === data.applicationRecord.id)?.agreements ?? [],
    }),
    applicationOptions: data.applications.map((application) => ({
      id: application.id,
      label: application.studentProfile?.fullNameAr ?? "طلب بدون اسم",
    })),
    selectedApplicationId: data.applicationRecord.id,
    actions: mapActions({
      canSeePayments: data.canSeePayments,
      actions: data.requiredActions,
    }).map((action) => ({
      ...action,
      href: withApplicationId(action.href, data.applicationRecord.id),
    })),
  };
}
