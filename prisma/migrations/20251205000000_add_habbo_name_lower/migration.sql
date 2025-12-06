-- AlterTable: Agregar campo habboNameLower y modificar habboName
-- Este campo almacenará el nombre en minúsculas para garantizar unicidad case-insensitive

-- Paso 1: Agregar columna habboNameLower (nullable temporalmente)
ALTER TABLE "User" ADD COLUMN "habboNameLower" TEXT;

-- Paso 2: Poblar habboNameLower con valores en minúsculas de habboName existente
UPDATE "User" SET "habboNameLower" = LOWER("habboName");

-- Paso 3: Hacer habboNameLower NOT NULL y UNIQUE
ALTER TABLE "User" ALTER COLUMN "habboNameLower" SET NOT NULL;
CREATE UNIQUE INDEX "User_habboNameLower_key" ON "User"("habboNameLower");

-- Paso 4: Crear índice adicional para búsquedas rápidas
CREATE INDEX "User_habboNameLower_idx" ON "User"("habboNameLower");

-- Paso 5: Eliminar constraint UNIQUE de habboName (mantener columna)
DROP INDEX IF EXISTS "User_habboName_key";
