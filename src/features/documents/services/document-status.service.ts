import { DocumentStatus } from "@prisma/client";
import type {
  ApplicationDocumentRecord,
  DocumentRequirementRecord,
} from "@/types/application";
import type { DocumentChecklistItem } from "@/types/document";

export function buildDocumentChecklist(params: {
  requirements: DocumentRequirementRecord[];
  documents: ApplicationDocumentRecord[];
}): DocumentChecklistItem[] {
  const documentsByRequirementId = new Map(
    params.documents.map((document) => [document.requirementId, document]),
  );

  return params.requirements
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((requirement) => {
      const document = documentsByRequirementId.get(requirement.id);

      return {
        requirementId: requirement.id,
        code: requirement.code,
        titleAr: requirement.titleAr,
        descriptionAr: requirement.descriptionAr,
        category: requirement.category,
        allowedUploaderRoles: requirement.allowedUploaderRoles,
        sortOrder: requirement.sortOrder,
        status: document?.status ?? DocumentStatus.MISSING,
        adminNote: document?.adminNote ?? null,
        fileAssetId: document?.fileAssetId ?? null,
        uploadedByUserId: document?.uploadedByUserId ?? null,
        reviewedAt: document?.reviewedAt ?? null,
        isMissingRecord: !document,
      };
    });
}
