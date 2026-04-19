import type { ApplicationContext, DocumentRequirementRecord } from "@/types/application";

type DocumentRequirementsResult = {
  requiredRequirements: DocumentRequirementRecord[];
  optionalRequirements: DocumentRequirementRecord[];
};

export function getApplicableDocumentRequirements(params: {
  context: ApplicationContext;
  requirements: DocumentRequirementRecord[];
  includePaymentReceipt?: boolean;
}): DocumentRequirementsResult {
  const activeRequirements = params.requirements
    .filter((requirement) => requirement.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const requiredRequirements = activeRequirements.filter((requirement) => {
    if (requirement.code === "payment_receipt" && !params.includePaymentReceipt) {
      return false;
    }

    if (requirement.isAlwaysRequired) {
      return true;
    }

    if (requirement.requiresUnder16 && params.context.isUnder16) {
      return true;
    }

    if (
      requirement.requiresGuardianCase &&
      params.context.requiresGuardianDocument
    ) {
      return true;
    }

    if (requirement.code === "mother_passport" && params.context.requiresMotherData) {
      return true;
    }

    return false;
  });

  const requiredIds = new Set(requiredRequirements.map((requirement) => requirement.id));
  const optionalRequirements = activeRequirements.filter(
    (requirement) => !requiredIds.has(requirement.id),
  );

  return {
    requiredRequirements,
    optionalRequirements,
  };
}
