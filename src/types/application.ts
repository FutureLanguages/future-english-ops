import type {
  AllowedUploaderRole,
  ApplicationStatus,
  DocumentCategory,
  DocumentStatus,
  ParentType,
  UserRole,
} from "@prisma/client";

export type ParentProfileRecord = {
  id: string;
  type: ParentType;
  fullName: string | null;
  mobileNumber: string | null;
  passportNumber: string | null;
  nationalIdNumber: string | null;
  relationToStudent: string | null;
  isDeceased: boolean;
  note: string | null;
};

export type StudentProfileRecord = {
  id: string;
  fullNameAr: string | null;
  fullNameEn: string | null;
  birthDate: Date | null;
  gender: string | null;
  nationality: string | null;
  city: string | null;
  schoolName: string | null;
  passportNumber: string | null;
  nationalIdNumber: string | null;
};

export type ApplicationRecord = {
  id: string;
  studentUserId: string;
  parentUserId: string;
  status: ApplicationStatus;
  totalCostSar: number;
  paidAmountSar: number;
  showPaymentToStudent: boolean;
  studentInfoLocked: boolean;
  studentBasicInfoLocked: boolean;
  studentAdditionalInfoLocked: boolean;
  parentInfoLocked: boolean;
  fatherInfoLocked: boolean;
  motherInfoLocked: boolean;
  guardianInfoLocked: boolean;
  documentsLocked: boolean;
  studentDocumentsLocked: boolean;
  parentDocumentsLocked: boolean;
  guardianDocumentsLocked: boolean;
  studentProfile: StudentProfileRecord | null;
  parentProfiles: ParentProfileRecord[];
};

export type ApplicationUser = {
  id: string;
  role: UserRole;
  mobileNumber: string;
};

export type DocumentRequirementRecord = {
  id: string;
  code: string;
  titleAr: string;
  descriptionAr: string | null;
  category: DocumentCategory;
  allowedUploaderRoles: AllowedUploaderRole[];
  isActive: boolean;
  sortOrder: number;
  isAlwaysRequired: boolean;
  requiresUnder16: boolean;
  requiresGuardianCase: boolean;
};

export type ApplicationDocumentRecord = {
  id: string;
  applicationId: string;
  requirementId: string;
  status: DocumentStatus;
  adminNote: string | null;
  uploadedByUserId: string | null;
  fileAssetId: string | null;
  reviewedAt: Date | null;
  requirement?: DocumentRequirementRecord;
};

export type PaymentReceiptRecord = {
  id: string;
  applicationId: string;
  fileAssetId: string;
  status: DocumentStatus;
  adminNote: string | null;
  uploadedByUserId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

export type ApplicationContext = {
  studentAge: number | null;
  isUnder16: boolean;
  hasDeceasedFather: boolean;
  hasGuardianProfile: boolean;
  requiresMotherData: boolean;
  requiresGuardianDocument: boolean;
};
