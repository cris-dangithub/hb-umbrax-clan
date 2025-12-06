-- CreateEnum for TimeRequestStatus
CREATE TYPE "TimeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum for TimeSessionStatus
CREATE TYPE "TimeSessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- Add new values to AuditAction enum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TIME_REQUEST_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TIME_REQUEST_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TIME_REQUEST_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TIME_SESSION_CLOSED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TIME_SUPERVISOR_TRANSFERRED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TIME_REQUEST_EXPIRED';

-- Add missionPromotionGoal to Rank table
ALTER TABLE "Rank" ADD COLUMN "missionPromotionGoal" VARCHAR(10);

-- CreateTable TimeRequest
CREATE TABLE "TimeRequest" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "TimeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "respondedById" TEXT,
    "responseNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable TimeSession
CREATE TABLE "TimeSession" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "status" "TimeSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "totalMinutes" INTEGER,

    CONSTRAINT "TimeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable TimeSegment
CREATE TABLE "TimeSegment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "currentSupervisorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "minutes" INTEGER,

    CONSTRAINT "TimeSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeRequest_subjectUserId_idx" ON "TimeRequest"("subjectUserId");
CREATE INDEX "TimeRequest_createdById_idx" ON "TimeRequest"("createdById");
CREATE INDEX "TimeRequest_respondedById_idx" ON "TimeRequest"("respondedById");
CREATE INDEX "TimeRequest_status_idx" ON "TimeRequest"("status");
CREATE INDEX "TimeRequest_expiresAt_idx" ON "TimeRequest"("expiresAt");
CREATE INDEX "TimeRequest_createdAt_idx" ON "TimeRequest"("createdAt");

CREATE INDEX "TimeSession_subjectUserId_idx" ON "TimeSession"("subjectUserId");
CREATE INDEX "TimeSession_status_idx" ON "TimeSession"("status");
CREATE INDEX "TimeSession_startedAt_idx" ON "TimeSession"("startedAt");

CREATE INDEX "TimeSegment_sessionId_idx" ON "TimeSegment"("sessionId");
CREATE INDEX "TimeSegment_currentSupervisorId_idx" ON "TimeSegment"("currentSupervisorId");
CREATE INDEX "TimeSegment_startedAt_idx" ON "TimeSegment"("startedAt");

-- AddForeignKey
ALTER TABLE "TimeRequest" ADD CONSTRAINT "TimeRequest_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimeRequest" ADD CONSTRAINT "TimeRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimeRequest" ADD CONSTRAINT "TimeRequest_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TimeSession" ADD CONSTRAINT "TimeSession_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TimeSegment" ADD CONSTRAINT "TimeSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TimeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeSegment" ADD CONSTRAINT "TimeSegment_currentSupervisorId_fkey" FOREIGN KEY ("currentSupervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
