-- Migration manuelle — 2026-05-14
-- Ajoute la catégorie de cible (PARTICULIER / RESIDENTIEL_COLLECTIF / TERTIAIRE / INDUSTRIE / AGRICULTURE)
-- sur Projet. Par défaut TERTIAIRE pour les lignes existantes — l'app force le choix à la création.
--
-- À exécuter :
--   npx prisma db execute --file prisma/migrations/_manual/2026_05_14_add_categorie_cible_projet.sql --schema prisma/schema.prisma
-- Après :  npx prisma generate

BEGIN;

DO $$ BEGIN
  CREATE TYPE "CategorieCible" AS ENUM ('PARTICULIER', 'RESIDENTIEL_COLLECTIF', 'TERTIAIRE', 'INDUSTRIE', 'AGRICULTURE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "projets"
  ADD COLUMN IF NOT EXISTS "categorie_cible" "CategorieCible" NOT NULL DEFAULT 'TERTIAIRE';

COMMIT;
