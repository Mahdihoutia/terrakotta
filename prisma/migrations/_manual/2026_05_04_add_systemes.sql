-- Migration manuelle — 2026-05-04
-- Crée la table "systemes" pour les équipements énergétiques d'un projet
-- (chauffage, ECS, ventilation, climatisation) — alimente le calcul Cep + DPE.
--
-- À exécuter via :
--   npx prisma db execute --file prisma/migrations/_manual/2026_05_04_add_systemes.sql --schema prisma/schema.prisma
-- Ou Supabase SQL Editor.
-- Après exécution :  npx prisma generate

BEGIN;

-- ─── Enums ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "SystemeType" AS ENUM ('CHAUFFAGE', 'ECS', 'VENTILATION', 'CLIMATISATION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SystemeVecteur" AS ENUM ('ELEC', 'GAZ_NATUREL', 'FIOUL', 'BOIS', 'PROPANE', 'RESEAU_CHALEUR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Table systemes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "systemes" (
  "id"              TEXT             PRIMARY KEY,
  "projet_id"       TEXT             NOT NULL,
  "type"            "SystemeType"    NOT NULL,
  "vecteur"         "SystemeVecteur" NOT NULL,
  "nom"             TEXT             NOT NULL,
  "rendement"       NUMERIC(65, 30)  NOT NULL DEFAULT 1,
  "part_couverture" NUMERIC(65, 30)  NOT NULL DEFAULT 1,
  "cop"             NUMERIC(65, 30),
  "notes"           TEXT,
  "created_at"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"      TIMESTAMP(3),
  CONSTRAINT "systemes_projet_id_fkey"
    FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "systemes_projet_id_idx"  ON "systemes"("projet_id");
CREATE INDEX IF NOT EXISTS "systemes_deleted_at_idx" ON "systemes"("deleted_at");

COMMIT;
