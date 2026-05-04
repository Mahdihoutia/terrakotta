-- Migration manuelle — 2026-05-04
-- Quick wins ingénieur : champs précision thermique + calibration facture sur Projet.
--
-- À exécuter :
--   npx prisma db execute --file prisma/migrations/_manual/2026_05_04_add_precision_thermique.sql --schema prisma/schema.prisma
-- Après :  npx prisma generate

BEGIN;

-- ─── Enum InertieClasse ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "InertieClasse" AS ENUM ('LEGERE', 'MOYENNE', 'LOURDE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Colonnes Projet ────────────────────────────────────────────
ALTER TABLE "projets"
  ADD COLUMN IF NOT EXISTS "nb_occupants"             INTEGER,
  ADD COLUMN IF NOT EXISTS "inertie"                  "InertieClasse",
  ADD COLUMN IF NOT EXISTS "intermittence_chauffage"  BOOLEAN          NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "permeabilite_air"         NUMERIC(65, 30),
  ADD COLUMN IF NOT EXISTS "conso_facture_chauffage"  NUMERIC(65, 30),
  ADD COLUMN IF NOT EXISTS "conso_facture_ecs"        NUMERIC(65, 30);

COMMIT;
