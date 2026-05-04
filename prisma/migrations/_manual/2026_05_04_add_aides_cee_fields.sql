-- Migration manuelle — 2026-05-04
-- Ajoute les colonnes CEE manquantes sur la table "aides" :
--   * fiche        (référence fiche d'opération standardisée, ex BAR-TH-171)
--   * kwh_cumac    (volume CEE en kWh cumac)
--   * prix_unitaire (€/MWh cumac, défaut 8 €/MWh)
--
-- Origine du gap : commit f7f0551 ajoutait ces champs au schéma Prisma
-- mais sans migration SQL associée. Création projet avec aide CEE → 500.
--
-- À exécuter :
--   psql "$DATABASE_URL" -f prisma/migrations/_manual/2026_05_04_add_aides_cee_fields.sql
-- Ou via Supabase SQL Editor.
-- Après exécution :  npx prisma generate

BEGIN;

ALTER TABLE "aides"
  ADD COLUMN IF NOT EXISTS "fiche"         TEXT,
  ADD COLUMN IF NOT EXISTS "kwh_cumac"     NUMERIC(65, 30),
  ADD COLUMN IF NOT EXISTS "prix_unitaire" NUMERIC(65, 30);

COMMIT;
