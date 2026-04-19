import type {
  AllowedUploaderRole,
  DocumentCategory,
  DocumentStatus,
} from "@prisma/client";

export type DocumentChecklistItem = {
  requirementId: string;
  code: string;
  titleAr: string;
  descriptionAr: string | null;
  category: DocumentCategory;
  allowedUploaderRoles: AllowedUploaderRole[];
  sortOrder: number;
  status: DocumentStatus;
  adminNote: string | null;
  fileAssetId: string | null;
  uploadedByUserId: string | null;
  reviewedAt: Date | null;
  isMissingRecord: boolean;
};
