-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_RANK_CHANGED', 'USER_RANK_BOSS_ASSIGNED', 'USER_RANK_BOSS_REMOVED', 'USER_DELETED', 'PROMOTION_REQUEST_CREATED', 'PROMOTION_REQUEST_APPROVED', 'PROMOTION_REQUEST_REJECTED', 'USER_LOGIN', 'USER_REGISTERED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isRankBoss" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PromotionRequest" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "currentRankId" INTEGER NOT NULL,
    "targetRankId" INTEGER NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'PENDING',
    "justification" TEXT NOT NULL,
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "PromotionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromotionRequest_subjectUserId_idx" ON "PromotionRequest"("subjectUserId");

-- CreateIndex
CREATE INDEX "PromotionRequest_requestedById_idx" ON "PromotionRequest"("requestedById");

-- CreateIndex
CREATE INDEX "PromotionRequest_reviewedById_idx" ON "PromotionRequest"("reviewedById");

-- CreateIndex
CREATE INDEX "PromotionRequest_status_idx" ON "PromotionRequest"("status");

-- CreateIndex
CREATE INDEX "PromotionRequest_targetRankId_idx" ON "PromotionRequest"("targetRankId");

-- CreateIndex
CREATE INDEX "PromotionRequest_createdAt_idx" ON "PromotionRequest"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "User_isRankBoss_idx" ON "User"("isRankBoss");

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_currentRankId_fkey" FOREIGN KEY ("currentRankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_targetRankId_fkey" FOREIGN KEY ("targetRankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
