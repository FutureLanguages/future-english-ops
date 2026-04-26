import type { ApplicationStatus } from "@prisma/client";

export type AdminNavItem = {
  key: string;
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  devOnlyLabel?: string;
};

export type AdminApplicationRow = {
  id: string;
  studentName: string;
  parentMobileNumber: string;
  status: ApplicationStatus;
  completionPercent: number;
  totalCostSar: number;
  paidAmountSar: number;
  remainingAmountSar: number;
  missingDocumentsCount: number;
  documentsNeedingReviewCount: number;
  reuploadCount: number;
  unreadMessagesCount: number;
  nextActionLabel: string;
  updatedAt: Date;
  city: string;
  needsAction: boolean;
  requiredActionsCount: number;
};

export type AdminWorkspaceTab = {
  id: string;
  label: string;
  href: string;
};

export type AdminWorkspaceDocumentItem = {
  id: string;
  requirementId: string;
  title: string;
  description: string | null;
  status: "MISSING" | "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
  adminNote: string | null;
  uploaderRolesLabel: string;
  uploadedByLabel: string | null;
  fileAssetId: string | null;
  fileMimeType: string | null;
  canReview: boolean;
};

export type AdminWorkspaceDocumentGroup = {
  id: string;
  title: string;
  items: AdminWorkspaceDocumentItem[];
};

export type AdminDashboardViewModel = {
  adminMobileNumber: string;
  navItems: AdminNavItem[];
  kpis: Array<{
    label: string;
    value: number;
    status?: ApplicationStatus;
    detail?: string;
  }>;
  actionQueue: Array<{
    label: string;
    description: string;
    value: number;
    href: string;
    priority: "high" | "medium" | "low";
  }>;
  workPanels: Array<{
    label: string;
    value: number;
    detail: string;
    href: string;
    actionLabel: string;
    tone: "neutral" | "attention" | "success";
  }>;
  studentsNeedingAction: Array<{
    applicationId: string;
    studentName: string;
    nextActionLabel: string;
    completionPercent: number;
    remainingAmountSar: number;
    documentsNeedingReviewCount: number;
    unreadMessagesCount: number;
    href: string;
  }>;
};

export type AdminStudentsViewModel = {
  adminMobileNumber: string;
  navItems: AdminNavItem[];
  rows: AdminApplicationRow[];
  presetCounts: Record<"all" | "needs_action" | "missing_documents" | "outstanding_payment" | "unread_messages" | "completed", number>;
  filters: {
    q: string;
    status: string;
    view: "all" | "needs_action" | "missing_documents" | "outstanding_payment" | "unread_messages" | "completed";
  };
};

export type AdminParentRow = {
  parentUserId: string;
  fullName: string | null;
  mobileNumber: string;
  linkedApplicationsCount: number;
  linkedStudentNames: string[];
  latestUpdatedAt: Date;
};

export type AdminParentDetailsViewModel = {
  adminMobileNumber: string;
  navItems: AdminNavItem[];
  parent: {
    id: string;
    fullName: string | null;
    mobileNumber: string;
  };
  linkedApplications: Array<{
    applicationId: string;
    studentName: string;
    status: ApplicationStatus;
    updatedAt: Date;
  }>;
};

export type AdminParentsViewModel = {
  adminMobileNumber: string;
  navItems: AdminNavItem[];
  rows: AdminParentRow[];
  filters: {
    q: string;
  };
};

export type AdminApplicationWorkspaceViewModel = {
  adminMobileNumber: string;
  navItems: AdminNavItem[];
  tabs: AdminWorkspaceTab[];
  application: AdminApplicationRow;
  summary: {
    studentUserId: string;
    studentMobileNumber: string;
    parentUserId: string;
    studentName: string;
    parentMobileNumber: string;
    status: ApplicationStatus;
    completionPercent: number;
    latestAdminNote: string | null;
  };
  overview: {
    paymentSummary: {
      totalCostSar: number;
      paidAmountSar: number;
      remainingAmountSar: number;
      isPaymentComplete: boolean;
    };
    progressIndicators: {
      profileDocumentsAgreements: {
        label: string;
        statusLabel: string;
        detailLabel: string;
        tone: "success" | "warning";
      };
      payments: {
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
    missingDocumentsCount: number;
    requiredActions: string[];
    unreadMessagesCount: number;
  };
  accessSettings: {
    showPaymentToStudent: boolean;
    sections: {
      studentInfoLocked: boolean;
      parentInfoLocked: boolean;
      documentsLocked: boolean;
    };
    subSections: {
      studentBasicInfoLocked: boolean;
      studentAdditionalInfoLocked: boolean;
      fatherInfoLocked: boolean;
      motherInfoLocked: boolean;
      guardianInfoLocked: boolean;
      studentDocumentsLocked: boolean;
      parentDocumentsLocked: boolean;
      guardianDocumentsLocked: boolean;
    };
  };
  documents: {
    groups: AdminWorkspaceDocumentGroup[];
    documentsNeedingReviewCount: number;
    reuploadCount: number;
  };
  payments: {
    totalFeesSar: number;
    discountSar: number;
    totalCostSar: number;
    paidAmountSar: number;
    remainingAmountSar: number;
    isPaymentComplete: boolean;
    latestPaymentNote: string | null;
    receipts: Array<{
      id: string;
      status: "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
      adminNote: string | null;
      fileAssetId: string;
      fileMimeType: string;
      uploadedByLabel: string | null;
      createdAt: Date;
    }>;
    fees: Array<{
      id: string;
      title: string;
      amountSar: number;
      note: string | null;
      feeDate: Date | null;
    }>;
    payments: Array<{
      id: string;
      amountSar: number;
      note: string | null;
      paymentDate: Date;
      linkedReceiptId: string | null;
      linkedReceiptFileAssetId: string | null;
      linkedReceiptFileMimeType: string | null;
    }>;
  };
  messaging: {
    unreadCount: number;
    threads: Array<{
      type: "STUDENT" | "PARENT";
      label: string;
      unreadCount: number;
      lastActivityAt: Date | null;
      messages: Array<{
        id: string;
        body: string;
        createdAt: Date;
        threadType: "STUDENT" | "PARENT";
        senderRole: "ADMIN" | "STUDENT" | "PARENT";
        senderLabel: string;
        senderMobileNumber: string;
        isAdminMessage: boolean;
        isCurrentUser: boolean;
        seen: boolean;
        read: boolean;
      }>;
    }>;
  };
  agreements: {
    templates: Array<{
      id: string;
      title: string;
      content: string;
      acknowledgmentText: string;
      isDefault: boolean;
      isActive: boolean;
    }>;
    assigned: Array<{
      id: string;
      title: string;
      assignedAt: Date;
      requiresStudentAcceptance: boolean;
      requiresParentAcceptance: boolean;
      studentAccepted: boolean;
      parentAccepted: boolean;
      cancellationRequestedAt: Date | null;
      studentAcceptedAt: Date | null;
      parentAcceptedAt: Date | null;
      studentFullName: string | null;
      parentFullName: string | null;
      studentSignature: string | null;
      parentSignature: string | null;
    }>;
  };
  statusControls: {
    currentStatus: ApplicationStatus;
    options: Array<{
      value: ApplicationStatus;
      label: string;
    }>;
  };
  studentSwitch: {
    previous: {
      applicationId: string;
      studentName: string;
    } | null;
    next: {
      applicationId: string;
      studentName: string;
    } | null;
    positionLabel: string;
  };
};

export type AdminReportColumnGroup = "basic" | "financial" | "documents" | "health" | "other";

export type AdminReportColumn = {
  key: string;
  label: string;
  group: AdminReportColumnGroup;
  documentCode?: string;
};

export type AdminReportRecordView = {
  applicationId: string;
  studentName: string;
  studentMobile: string;
  parentName: string;
  parentMobile: string;
  status: ApplicationStatus;
  totalFeesSar: number;
  totalDiscountSar: number;
  totalPaidSar: number;
  remainingSar: number;
  documentsCompletedCount: number;
  unreadMessagesCount: number;
  receiptsCount: number;
  updatedAt: string;
  healthFlags: Record<string, boolean>;
  documentStatuses: Record<string, "MISSING" | "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED">;
};

export type AdminReportsViewModel = {
  adminMobileNumber: string;
  navItems: AdminNavItem[];
  filters: {
    q: string;
    status: string;
    paymentView: "all" | "remaining_only" | "paid_only";
    healthFilter: string;
  };
  columns: AdminReportColumn[];
  defaultColumnKeys: string[];
  rows: AdminReportRecordView[];
};

export type AdminFinanceViewModel = {
  adminMobileNumber: string;
  navItems: AdminNavItem[];
  filters: {
    status: string;
    paymentView: "all" | "remaining_only" | "paid_only";
    sort: "highest_remaining" | "lowest_remaining";
  };
  summary: {
    totalFeesSar: number;
    totalDiscountSar: number;
    totalPaidSar: number;
    totalRemainingSar: number;
    fullyPaidStudentsCount: number;
    studentsWithRemainingCount: number;
    highestRemainingStudent: {
      studentName: string;
      remainingSar: number;
    } | null;
  };
  rows: Array<{
    applicationId: string;
    studentName: string;
    status: ApplicationStatus;
    totalFeesSar: number;
    totalDiscountSar: number;
    totalPaidSar: number;
    remainingSar: number;
  }>;
};
