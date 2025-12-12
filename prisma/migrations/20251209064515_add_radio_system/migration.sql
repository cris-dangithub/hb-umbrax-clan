-- CreateEnum
CREATE TYPE "RadioStreamType" AS ENUM ('YOUTUBE', 'TWITCH', 'ICECAST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RadioStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SongRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'PLAYED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'USER_DJ_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_DJ_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE 'RADIO_SESSION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'RADIO_SESSION_STARTED';
ALTER TYPE "AuditAction" ADD VALUE 'RADIO_SESSION_ENDED';
ALTER TYPE "AuditAction" ADD VALUE 'RADIO_SESSION_CANCELLED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDJ" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RadioSession" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "streamType" "RadioStreamType" NOT NULL,
    "streamUrl" TEXT NOT NULL,
    "status" "RadioStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "playlist" JSONB,
    "listenerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadioSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongRequest" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "songTitle" TEXT NOT NULL,
    "artist" TEXT,
    "status" "SongRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radio_config" (
    "id" TEXT NOT NULL,
    "icecastEnabled" BOOLEAN NOT NULL DEFAULT false,
    "icecastServerUrl" TEXT,
    "icecastAdminUser" TEXT,
    "icecastAdminPass" TEXT,
    "maxConcurrentDJs" INTEGER NOT NULL DEFAULT 1,
    "requestsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radio_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RadioSession_djId_idx" ON "RadioSession"("djId");

-- CreateIndex
CREATE INDEX "RadioSession_status_idx" ON "RadioSession"("status");

-- CreateIndex
CREATE INDEX "RadioSession_scheduledStart_idx" ON "RadioSession"("scheduledStart");

-- CreateIndex
CREATE INDEX "RadioSession_createdAt_idx" ON "RadioSession"("createdAt");

-- CreateIndex
CREATE INDEX "SongRequest_sessionId_idx" ON "SongRequest"("sessionId");

-- CreateIndex
CREATE INDEX "SongRequest_requestedById_idx" ON "SongRequest"("requestedById");

-- CreateIndex
CREATE INDEX "SongRequest_status_idx" ON "SongRequest"("status");

-- CreateIndex
CREATE INDEX "SongRequest_createdAt_idx" ON "SongRequest"("createdAt");

-- CreateIndex
CREATE INDEX "User_isDJ_idx" ON "User"("isDJ");

-- AddForeignKey
ALTER TABLE "RadioSession" ADD CONSTRAINT "RadioSession_djId_fkey" FOREIGN KEY ("djId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongRequest" ADD CONSTRAINT "SongRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RadioSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongRequest" ADD CONSTRAINT "SongRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
