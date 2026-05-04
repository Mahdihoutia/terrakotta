-- Migration manuelle — 2026-05-04
-- Variantes (forks d'inputs projet) + Calculs (snapshots immuables inputs/outputs).
--
-- Règle d'or : un calcul n'est jamais recalculé en place. Chaque exécution
-- du moteur crée un nouveau Calcul lié à une Variante (ou directement au
-- projet pour l'état initial). Permet rejouabilité, audit trail, comparaison
-- temporelle.
--
-- À exécuter :
--   npx prisma db execute --file prisma/migrations/_manual/2026_05_04_add_variantes_calculs.sql --schema prisma/schema.prisma
-- Après exécution :  npx prisma generate

BEGIN;

-- ─── Enums ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "VarianteType" AS ENUM ('INITIAL', 'VARIANTE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CalculType" AS ENUM ('DEPERDITIONS', 'BESOINS_CHAUFFAGE', 'DPE', 'AIDES', 'BILAN_GLOBAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Variantes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "variantes" (
  "id"          TEXT            PRIMARY KEY,
  "projet_id"   TEXT            NOT NULL,
  "parent_id"   TEXT,
  "type"        "VarianteType"  NOT NULL DEFAULT 'VARIANTE',
  "nom"         TEXT            NOT NULL,
  "description" TEXT,
  "inputs_json" TEXT            NOT NULL,
  "created_at"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"  TIMESTAMP(3),
  CONSTRAINT "variantes_projet_id_fkey"
    FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE,
  CONSTRAINT "variantes_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "variantes"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "variantes_projet_id_idx"  ON "variantes"("projet_id");
CREATE INDEX IF NOT EXISTS "variantes_deleted_at_idx" ON "variantes"("deleted_at");

-- ─── Calculs (snapshots immuables) ─────────────────────────────
CREATE TABLE IF NOT EXISTS "calculs" (
  "id"              TEXT          PRIMARY KEY,
  "projet_id"       TEXT          NOT NULL,
  "variante_id"     TEXT,
  "type"            "CalculType"  NOT NULL,
  "inputs_json"     TEXT          NOT NULL,
  "outputs_json"    TEXT          NOT NULL,
  "moteur_version"  TEXT          NOT NULL,
  "baremes_version" TEXT,
  "notes"           TEXT,
  "created_at"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "calculs_projet_id_fkey"
    FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE,
  CONSTRAINT "calculs_variante_id_fkey"
    FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "calculs_projet_id_idx"   ON "calculs"("projet_id");
CREATE INDEX IF NOT EXISTS "calculs_variante_id_idx" ON "calculs"("variante_id");
CREATE INDEX IF NOT EXISTS "calculs_type_idx"        ON "calculs"("type");
CREATE INDEX IF NOT EXISTS "calculs_created_at_idx"  ON "calculs"("created_at");

COMMIT;
