-- Migration manuelle — 2026-07-20
-- Cockpit Décret Tertiaire (DEET) : profil par projet.
--
-- Ajoute :
--   • enum DeetMethode (RELATIVE | ABSOLUE)
--   • enum DeetActivite (BUREAUX, ENSEIGNEMENT, ...)
--   • table deet_profils (1-1 avec projet)
--
-- À exécuter :
--   npx prisma db execute --file prisma/migrations/_manual/2026_07_20_add_deet_profil.sql --schema prisma/schema.prisma
-- Après :  npx prisma generate

BEGIN;

DO $$ BEGIN
  CREATE TYPE "DeetMethode" AS ENUM ('RELATIVE', 'ABSOLUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "DeetActivite" AS ENUM (
    'BUREAUX',
    'ENSEIGNEMENT',
    'HOSPITALIER',
    'HOTELLERIE_RESTAURATION',
    'COMMERCE',
    'LOGISTIQUE_INDUSTRIE',
    'SPORT_LOISIRS',
    'CULTURE',
    'AUTRE_TERTIAIRE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "deet_profils" (
  "id"                          TEXT PRIMARY KEY,
  "projet_id"                   TEXT NOT NULL UNIQUE,
  "assujetti"                   BOOLEAN NOT NULL DEFAULT TRUE,
  "methode"                     "DeetMethode" NOT NULL DEFAULT 'RELATIVE',
  "activite"                    "DeetActivite" NOT NULL,
  "zone_climatique"             TEXT NOT NULL,
  "surface_plancher"            NUMERIC(65, 30) NOT NULL,
  "annee_reference"             INTEGER NOT NULL,
  "conso_reference_kwh_ef_m2"   NUMERIC(65, 30) NOT NULL,
  "conso_actuelle_kwh_ef_m2"    NUMERIC(65, 30),
  "annee_actuelle"              INTEGER,
  "notes"                       TEXT,
  "created_at"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "deet_profils_projet_id_fkey"
    FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "deet_profils_projet_id_idx" ON "deet_profils"("projet_id");

COMMIT;
