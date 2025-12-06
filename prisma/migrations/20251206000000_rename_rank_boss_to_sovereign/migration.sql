-- Migración: Renombrar isRankBoss a isSovereign y actualizar enums
-- Esta migración es idempotente y puede ejecutarse varias veces

-- Paso 1: Agregar columna isSovereign si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'isSovereign'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "isSovereign" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Paso 2: Copiar datos de isRankBoss a isSovereign si isRankBoss existe
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'isRankBoss'
  ) THEN
    EXECUTE 'UPDATE "User" SET "isSovereign" = "isRankBoss"';
    ALTER TABLE "User" DROP COLUMN "isRankBoss";
  END IF;
END $$;

-- Paso 3: Gestionar índices
DROP INDEX IF EXISTS "User_isRankBoss_idx";

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'User_isSovereign_idx'
  ) THEN
    CREATE INDEX "User_isSovereign_idx" ON "User"("isSovereign");
  END IF;
END $$;

-- Paso 4: Actualizar enum AuditAction si es necesario
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AuditAction' AND e.enumlabel = 'USER_SOVEREIGN_ASSIGNED'
  ) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'USER_SOVEREIGN_ASSIGNED';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AuditAction' AND e.enumlabel = 'USER_SOVEREIGN_REMOVED'
  ) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'USER_SOVEREIGN_REMOVED';
  END IF;
END $$;
