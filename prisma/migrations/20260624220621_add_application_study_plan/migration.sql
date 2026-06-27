-- CreateTable
CREATE TABLE "ApplicationStudyPlan" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "instituteName" TEXT,
    "instituteBranch" TEXT,
    "country" TEXT,
    "city" TEXT,
    "programName" TEXT,
    "programStartDate" TIMESTAMP(3),
    "programEndDate" TIMESTAMP(3),
    "housingType" TEXT,
    "roomType" TEXT,
    "housingNotes" TEXT,
    "departureDate" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "airlineName" TEXT,
    "flightNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationStudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationStudyPlan_applicationId_key" ON "ApplicationStudyPlan"("applicationId");

-- AddForeignKey
ALTER TABLE "ApplicationStudyPlan" ADD CONSTRAINT "ApplicationStudyPlan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
