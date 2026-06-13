-- CreateTable
CREATE TABLE "BotOperator" (
    "id" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "telegramUsername" TEXT,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'OPERATOR',
    "permissions" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "linkedAdminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "BotOperator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotSession" (
    "id" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "workflow" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "operatorTelegramUserId" TEXT,
    "operatorAdminUserId" TEXT,
    "operatorDisplayName" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "targetPhone" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotOperator_telegramUserId_key" ON "BotOperator"("telegramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "BotSession_idempotencyKey_key" ON "BotSession"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BotSession_telegramUserId_idx" ON "BotSession"("telegramUserId");

-- CreateIndex
CREATE INDEX "BotSession_status_idx" ON "BotSession"("status");

-- CreateIndex
CREATE INDEX "BotSession_expiresAt_idx" ON "BotSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AutomationAuditLog_action_idx" ON "AutomationAuditLog"("action");

-- CreateIndex
CREATE INDEX "AutomationAuditLog_status_idx" ON "AutomationAuditLog"("status");

-- CreateIndex
CREATE INDEX "AutomationAuditLog_operatorAdminUserId_idx" ON "AutomationAuditLog"("operatorAdminUserId");

-- CreateIndex
CREATE INDEX "AutomationAuditLog_targetPhone_idx" ON "AutomationAuditLog"("targetPhone");

-- CreateIndex
CREATE INDEX "AutomationAuditLog_createdAt_idx" ON "AutomationAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "BotOperator" ADD CONSTRAINT "BotOperator_linkedAdminUserId_fkey" FOREIGN KEY ("linkedAdminUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

