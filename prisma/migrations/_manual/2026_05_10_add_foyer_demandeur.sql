-- Migration manuelle — 2026-05-10
-- B3 audit : foyer demandeur sur Projet (catégorie MaPrimeRénov').
-- Avant ce changement, le calcul MPR utilisait FOYER_DEMO hardcodé pour
-- tous les projets (cf scenarios/page.tsx) → chiffrage faux à 100 %.
--
-- À exécuter :
--   npx prisma db execute --file prisma/migrations/_manual/2026_05_10_add_foyer_demandeur.sql --schema prisma/schema.prisma
-- Après :  npx prisma generate

BEGIN;

-- ─── Enum ZoneRevenuFoyer ───────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ZoneRevenuFoyer" AS ENUM ('IDF', 'AUTRES');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Colonnes Projet ────────────────────────────────────────────
ALTER TABLE "projets"
  ADD COLUMN IF NOT EXISTS "nb_personnes_foyer"  INTEGER,
  ADD COLUMN IF NOT EXISTS "rfr_foyer"           NUMERIC(65, 30),
  ADD COLUMN IF NOT EXISTS "zone_revenu_foyer"   "ZoneRevenuFoyer";

COMMIT;
