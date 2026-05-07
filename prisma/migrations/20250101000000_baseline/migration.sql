-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'INCOMPLETE', 'UNDER_REVIEW', 'WAITING_PAYMENT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PortalMode" AS ENUM ('GENERAL_STUDY', 'SUMMER_PROGRAM');

-- CreateEnum
CREATE TYPE "ParentType" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('STUDENT', 'PARENT', 'GUARDIAN', 'PAYMENT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('MISSING', 'UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REUPLOAD_REQUESTED');

-- CreateEnum
CREATE TYPE "AllowedUploaderRole" AS ENUM ('ADMIN', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "MessageThreadType" AS ENUM ('STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "ApplicationNoteType" AS ENUM ('NOTE', 'MESSAGE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MESSAGE', 'DOCUMENT', 'PAYMENT', 'AGREEMENT');

-- CreateEnum
CREATE TYPE "FinancialDifferenceSettlementType" AS ENUM ('DEFICIT', 'EXCESS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "totalCostSar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paidAmountSar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "studentInfoLocked" BOOLEAN NOT NULL DEFAULT false,
    "studentBasicInfoLocked" BOOLEAN NOT NULL DEFAULT false,
    "studentAdditionalInfoLocked" BOOLEAN NOT NULL DEFAULT false,
    "parentInfoLocked" BOOLEAN NOT NULL DEFAULT false,
    "fatherInfoLocked" BOOLEAN NOT NULL DEFAULT false,
    "motherInfoLocked" BOOLEAN NOT NULL DEFAULT false,
    "guardianInfoLocked" BOOLEAN NOT NULL DEFAULT false,
    "documentsLocked" BOOLEAN NOT NULL DEFAULT false,
    "studentDocumentsLocked" BOOLEAN NOT NULL DEFAULT false,
    "parentDocumentsLocked" BOOLEAN NOT NULL DEFAULT false,
    "guardianDocumentsLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "showPaymentToStudent" BOOLEAN NOT NULL DEFAULT false,
    "studentLastViewedNotesAt" TIMESTAMP(3),
    "parentLastViewedNotesAt" TIMESTAMP(3),
    "adminLastViewedNotesAt" TIMESTAMP(3),
    "studentLastViewedStudentThreadAt" TIMESTAMP(3),
    "parentLastViewedStudentThreadAt" TIMESTAMP(3),
    "parentLastViewedParentThreadAt" TIMESTAMP(3),
    "adminLastViewedStudentThreadAt" TIMESTAMP(3),
    "adminLastViewedParentThreadAt" TIMESTAMP(3),

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationPortalConfig" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "mode" "PortalMode" NOT NULL DEFAULT 'GENERAL_STUDY',
    "showCountdown" BOOLEAN,
    "showTripDetails" BOOLEAN,
    "showFlightInfo" BOOLEAN,
    "showSupervisorInfo" BOOLEAN,
    "showProgramEvents" BOOLEAN,
    "showEnrollmentCard" BOOLEAN,
    "showPaymentSchedule" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationPortalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalConfigAuditLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "executorUserId" TEXT NOT NULL,
    "changedFields" TEXT[],
    "oldValues" JSONB NOT NULL,
    "newValues" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalConfigAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "acknowledgmentText" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgreementTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationAgreement" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "contentSnapshot" TEXT NOT NULL,
    "acknowledgmentSnapshot" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiresStudentAcceptance" BOOLEAN NOT NULL DEFAULT true,
    "requiresParentAcceptance" BOOLEAN NOT NULL DEFAULT true,
    "studentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "parentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "studentAcceptedAt" TIMESTAMP(3),
    "parentAcceptedAt" TIMESTAMP(3),
    "studentFullName" TEXT,
    "parentFullName" TEXT,
    "studentSignature" TEXT,
    "parentSignature" TEXT,
    "cancellationRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fullNameAr" TEXT,
    "fullNameEn" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "nationality" TEXT,
    "city" TEXT,
    "schoolName" TEXT,
    "languageLevel" TEXT,
    "hobbies" TEXT,
    "schoolStage" TEXT,
    "passportNumber" TEXT,
    "nationalIdNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentHealthProfile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "allowStudentView" BOOLEAN NOT NULL DEFAULT false,
    "allowStudentEdit" BOOLEAN NOT NULL DEFAULT false,
    "hasMedicalConditions" BOOLEAN NOT NULL DEFAULT false,
    "medicalConditionsDetails" TEXT,
    "hasSleepDisorders" BOOLEAN NOT NULL DEFAULT false,
    "sleepDisordersDetails" TEXT,
    "hasAllergies" BOOLEAN NOT NULL DEFAULT false,
    "allergiesDetails" TEXT,
    "hasContinuousMedication" BOOLEAN NOT NULL DEFAULT false,
    "continuousMedicationDetails" TEXT,
    "hasPhobia" BOOLEAN NOT NULL DEFAULT false,
    "phobiaDetails" TEXT,
    "hasBedwetting" BOOLEAN NOT NULL DEFAULT false,
    "bedwettingDetails" TEXT,
    "needsSpecialSupervisorFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "specialSupervisorFollowUpDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentHealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationParentNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationParentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "ParentType" NOT NULL,
    "fullName" TEXT,
    "mobileNumber" TEXT,
    "passportNumber" TEXT,
    "nationalIdNumber" TEXT,
    "relationToStudent" TEXT,
    "isDeceased" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequirement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "category" "DocumentCategory" NOT NULL,
    "allowedUploaderRoles" "AllowedUploaderRole"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isAlwaysRequired" BOOLEAN NOT NULL DEFAULT false,
    "requiresUnder16" BOOLEAN NOT NULL DEFAULT false,
    "requiresGuardianCase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "fileAssetId" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'MISSING',
    "adminNote" TEXT,
    "uploadedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "threadType" "MessageThreadType" NOT NULL DEFAULT 'STUDENT',
    "noteType" "ApplicationNoteType" NOT NULL DEFAULT 'MESSAGE',
    "senderRole" "UserRole",
    "senderName" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "adminNote" TEXT,
    "uploadedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationFee" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "feeDate" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationPayment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "paymentReceiptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "NotificationType" NOT NULL,
    "actorName" TEXT,
    "actorRole" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialDifferenceSettlement" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "executedByUserId" TEXT NOT NULL,
    "settlementType" "FinancialDifferenceSettlementType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "deltaBefore" DECIMAL(10,2) NOT NULL,
    "deltaAfter" DECIMAL(10,2) NOT NULL,
    "netAmountBefore" DECIMAL(10,2) NOT NULL,
    "netAmountAfter" DECIMAL(10,2) NOT NULL,
    "paidAmountSar" DECIMAL(10,2) NOT NULL,
    "thresholdSar" DECIMAL(10,2) NOT NULL,
    "relatedFeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialDifferenceSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobileNumber_key" ON "User"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Application_studentUserId_key" ON "Application"("studentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationPortalConfig_applicationId_key" ON "ApplicationPortalConfig"("applicationId");

-- CreateIndex
CREATE INDEX "PortalConfigAuditLog_applicationId_createdAt_idx" ON "PortalConfigAuditLog"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "PortalConfigAuditLog_executorUserId_createdAt_idx" ON "PortalConfigAuditLog"("executorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationAgreement_applicationId_idx" ON "ApplicationAgreement"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_applicationId_key" ON "StudentProfile"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_passportNumber_key" ON "StudentProfile"("passportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_nationalIdNumber_key" ON "StudentProfile"("nationalIdNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StudentHealthProfile_applicationId_key" ON "StudentHealthProfile"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationParentNote_applicationId_key" ON "ApplicationParentNote"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_applicationId_type_key" ON "ParentProfile"("applicationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequirement_code_key" ON "DocumentRequirement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationDocument_applicationId_requirementId_key" ON "ApplicationDocument"("applicationId", "requirementId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSetting_key_key" ON "AdminSetting"("key");

-- CreateIndex
CREATE INDEX "FinancialDifferenceSettlement_applicationId_createdAt_idx" ON "FinancialDifferenceSettlement"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialDifferenceSettlement_executedByUserId_createdAt_idx" ON "FinancialDifferenceSettlement"("executedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationPortalConfig" ADD CONSTRAINT "ApplicationPortalConfig_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalConfigAuditLog" ADD CONSTRAINT "PortalConfigAuditLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalConfigAuditLog" ADD CONSTRAINT "PortalConfigAuditLog_executorUserId_fkey" FOREIGN KEY ("executorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementTemplate" ADD CONSTRAINT "AgreementTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationAgreement" ADD CONSTRAINT "ApplicationAgreement_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationAgreement" ADD CONSTRAINT "ApplicationAgreement_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AgreementTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentHealthProfile" ADD CONSTRAINT "StudentHealthProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationParentNote" ADD CONSTRAINT "ApplicationParentNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationParentNote" ADD CONSTRAINT "ApplicationParentNote_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DocumentRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationFee" ADD CONSTRAINT "ApplicationFee_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationPayment" ADD CONSTRAINT "ApplicationPayment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationPayment" ADD CONSTRAINT "ApplicationPayment_paymentReceiptId_fkey" FOREIGN KEY ("paymentReceiptId") REFERENCES "PaymentReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDifferenceSettlement" ADD CONSTRAINT "FinancialDifferenceSettlement_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDifferenceSettlement" ADD CONSTRAINT "FinancialDifferenceSettlement_executedByUserId_fkey" FOREIGN KEY ("executedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDifferenceSettlement" ADD CONSTRAINT "FinancialDifferenceSettlement_relatedFeeId_fkey" FOREIGN KEY ("relatedFeeId") REFERENCES "ApplicationFee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
