-- Migration manuelle — 2026-07-16
-- Priorités 1 & 2 : consommations réelles + météo ERA5 horaire.
-- Ajoute :
--   • enum SourceReleve (R = relevé, E = estimé, F = facture)
--   • table consos_relevees   (relevés mensuels par vecteur)
--   • table calibrations      (résultats calage ERA5 + indicateurs ASHRAE G14)
--   • table meteo_horaire_cache (cache Open-Meteo Archive / ERA5)
--
-- À exécuter :
--   npx prisma db execute --file prisma/migrations/_manual/2026_07_16_add_calibration_meteo_era5.sql --schema prisma/schema.prisma
-- Après :  npx prisma generate

BEGIN;

-- ─── Enum SourceReleve ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "SourceReleve" AS ENUM ('R', 'E', 'F');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Table consos_relevees ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "consos_relevees" (
  "id"             TEXT PRIMARY KEY,
  "projet_id"      TEXT NOT NULL,
  "vecteur"        "SystemeVecteur" NOT NULL,
  "periode_debut"  TIMESTAMP(3) NOT NULL,
  "periode_fin"    TIMESTAMP(3) NOT NULL,
  "kwh"            NUMERIC(65, 30) NOT NULL,
  "source"         "SourceReleve" NOT NULL DEFAULT 'R',
  "compteur_ref"   TEXT,
  "notes"          TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"     TIMESTAMP(3),
  CONSTRAINT "consos_relevees_projet_id_fkey"
    FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "consos_relevees_projet_id_idx"        ON "consos_relevees"("projet_id");
CREATE INDEX IF NOT EXISTS "consos_relevees_deleted_at_idx"       ON "consos_relevees"("deleted_at");
CREATE INDEX IF NOT EXISTS "consos_relevees_projet_periode_idx"   ON "consos_relevees"("projet_id", "periode_debut");

-- ─── Table calibrations ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "calibrations" (
  "id"                    TEXT PRIMARY KEY,
  "projet_id"             TEXT NOT NULL,
  "periode_debut"         TIMESTAMP(3) NOT NULL,
  "periode_fin"           TIMESTAMP(3) NOT NULL,
  "latitude"              NUMERIC(65, 30) NOT NULL,
  "longitude"             NUMERIC(65, 30) NOT NULL,
  "rendement"             NUMERIC(65, 30) NOT NULL,
  "t_arret_chauffage"     NUMERIC(65, 30) NOT NULL,
  "t_base"                NUMERIC(65, 30) NOT NULL,
  "somme_dh"              NUMERIC(65, 30) NOT NULL,
  "energie_relevee"       NUMERIC(65, 30) NOT NULL,
  "p_calee_dh"            NUMERIC(65, 30) NOT NULL,
  "p_calee_regression"    NUMERIC(65, 30),
  "ecart_methodes"        NUMERIC(65, 30),
  "r2"                    NUMERIC(65, 30),
  "rmse"                  NUMERIC(65, 30),
  "cv_rmse"               NUMERIC(65, 30),
  "nmbe"                  NUMERIC(65, 30),
  "conforme_ashrae"       BOOLEAN NOT NULL DEFAULT FALSE,
  "payload_json"          JSONB NOT NULL,
  "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "calibrations_projet_id_fkey"
    FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "calibrations_projet_id_idx" ON "calibrations"("projet_id");

-- ─── Table meteo_horaire_cache ─────────────────────────────────
CREATE TABLE IF NOT EXISTS "meteo_horaire_cache" (
  "id"             TEXT PRIMARY KEY,
  "lat_r"          NUMERIC(65, 30) NOT NULL,
  "lon_r"          NUMERIC(65, 30) NOT NULL,
  "periode_debut"  TIMESTAMP(3) NOT NULL,
  "periode_fin"    TIMESTAMP(3) NOT NULL,
  "payload_json"   JSONB NOT NULL,
  "source"         TEXT NOT NULL DEFAULT 'open-meteo-archive',
  "fetched_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "meteo_horaire_cache_zone_periode_unique"
  ON "meteo_horaire_cache"("lat_r", "lon_r", "periode_debut", "periode_fin");

COMMIT;
