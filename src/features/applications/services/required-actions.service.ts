import { DocumentStatus } from "@prisma/client";
import type { DocumentChecklistItem } from "@/types/document";
import type { RequiredAction } from "@/types/payment";
import type { ProfileCompletenessResult } from "./profile-completeness.service";

export function getRequiredActions(params: {
  profile: ProfileCompletenessResult;
  documents: DocumentChecklistItem[];
  hasOutstandingPayment: boolean;
}): RequiredAction[] {
  const actions: RequiredAction[] = [];

  for (const document of params.documents) {
    if (
      document.status === DocumentStatus.REJECTED ||
      document.status === DocumentStatus.REUPLOAD_REQUESTED
    ) {
      actions.push({
        id: `document-reupload-${document.code}`,
        label: `إعادة رفع ${document.titleAr}`,
        section: "documents",
        kind: "reupload_document",
        priority: 1,
      });
    }
  }

  for (const document of params.documents) {
    if (document.status === DocumentStatus.MISSING) {
      actions.push({
        id: `document-missing-${document.code}`,
        label: `رفع ${document.titleAr}`,
        section: "documents",
        kind: "missing_document",
        priority: 2,
      });
    }
  }

  for (const field of params.profile.missingStudentFields) {
    actions.push({
      id: `student-field-${field.field}`,
      label: `استكمال ${field.label}`,
      section: "student_info",
      kind: "missing_profile",
      priority: 3,
    });
  }

  for (const field of params.profile.missingParentFields) {
    actions.push({
      id: `parent-field-${field.parentType}-${field.field}`,
      label: `استكمال ${field.label}`,
      section: "parent_info",
      kind: "missing_profile",
      priority: 3,
    });
  }

  if (params.hasOutstandingPayment) {
    actions.push({
      id: "payment-outstanding",
      label: "استكمال المبلغ المتبقي ورفع إيصال الدفع",
      section: "payments",
      kind: "payment",
      priority: 4,
    });
  }

  return actions.sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.label.localeCompare(right.label, "ar");
  });
}
