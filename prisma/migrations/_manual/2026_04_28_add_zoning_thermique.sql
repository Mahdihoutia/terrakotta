-- Migration manuelle — 2026-04-28
-- Zoning thermique multi-zones (style Pleiades).
-- Crée l'enum ZoneUsage et les tables batiments, zones, zone_parois,
-- scenarios_occupation.
--
-- À passer en local : psql "$DATABASE_URL" -f prisma/migrations/_manual/2026_04_28_add_zoning_thermique.sql
-- Ou via Supabase SQL Editor.
-- Après exécution :  npx prisma generate

BEGIN;

-- Enum ZoneUsage (idempotent) ----------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ZoneUsage') THEN
    CREATE TYPE "ZoneUsage" AS ENUM (
      'BUREAUX', 'OPEN_SPACE', 'CIRCULATION', 'ARCHIVES', 'SALLE_REUNION',
      'SALLE_SERVEUR', 'COMMERCE', 'RESTAURATION', 'LOGEMENT', 'HALL_ACCUEIL',
      'TECHNIQUE', 'AUTRE'
    );
  END IF;
END$$;

-- Table scenarios_occupation -----------------------------------------------
CREATE TABLE IF NOT EXISTS "scenarios_occupation" (
  "id"           TEXT PRIMARY KEY,
  "nom"          TEXT NOT NULL,
  "description"  TEXT,
  "pattern_json" TEXT NOT NULL,
  "preset"       BOOLEAN NOT NULL DEFAULT false,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"   TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "scenarios_occupation_deleted_at_idx"
  ON "scenarios_occupation" ("deleted_at");

-- Table batiments ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "batiments" (
  "id"                TEXT PRIMARY KEY,
  "nom"               TEXT NOT NULL,
  "description"       TEXT,
  "zone_climatique"   TEXT NOT NULL,
  "altitude"          DECIMAL(65, 30),
  "orientation"       TEXT,
  "projet_id"         TEXT,
  "audit_document_id" TEXT,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"        TIMESTAMP(3),
  CONSTRAINT "batiments_projet_fk"
    FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "batiments_deleted_at_idx" ON "batiments" ("deleted_at");
CREATE INDEX IF NOT EXISTS "batiments_projet_id_idx"  ON "batiments" ("projet_id");

-- Table zones --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "zones" (
  "id"                       TEXT PRIMARY KEY,
  "batiment_id"              TEXT NOT NULL,
  "nom"                      TEXT NOT NULL,
  "usage"                    "ZoneUsage" NOT NULL,
  "surface"                  DECIMAL(65, 30) NOT NULL,
  "hauteur_sous_plafond"     DECIMAL(65, 30) NOT NULL,
  "consigne_chauffage_occ"   DECIMAL(65, 30) NOT NULL DEFAULT 20,
  "consigne_chauffage_red"   DECIMAL(65, 30) NOT NULL DEFAULT 16,
  "consigne_clim_occ"        DECIMAL(65, 30) NOT NULL DEFAULT 26,
  "consigne_clim_red"        DECIMAL(65, 30) NOT NULL DEFAULT 28,
  "densite_occupation"       DECIMAL(65, 30) NOT NULL DEFAULT 15,
  "apports_par_personne"     DECIMAL(65, 30) NOT NULL DEFAULT 80,
  "apports_equipements"      DECIMAL(65, 30) NOT NULL DEFAULT 15,
  "apports_eclairage"        DECIMAL(65, 30) NOT NULL DEFAULT 8,
  "qvmc_m3h_m2"              DECIMAL(65, 30) NOT NULL DEFAULT 2.5,
  "efficacite_df"            DECIMAL(65, 30) NOT NULL DEFAULT 0,
  "scenario_id"              TEXT,
  "created_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"               TIMESTAMP(3),
  CONSTRAINT "zones_batiment_fk"
    FOREIGN KEY ("batiment_id") REFERENCES "batiments"("id") ON DELETE CASCADE,
  CONSTRAINT "zones_scenario_fk"
    FOREIGN KEY ("scenario_id") REFERENCES "scenarios_occupation"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "zones_deleted_at_idx"  ON "zones" ("deleted_at");
CREATE INDEX IF NOT EXISTS "zones_batiment_id_idx" ON "zones" ("batiment_id");

-- Table zone_parois --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "zone_parois" (
  "id"          TEXT PRIMARY KEY,
  "zone_id"     TEXT NOT NULL,
  "paroi_id"    TEXT NOT NULL,
  "surface"     DECIMAL(65, 30) NOT NULL,
  "orientation" TEXT,
  "inclinaison" DECIMAL(65, 30) DEFAULT 90,
  "cote_paire"  BOOLEAN DEFAULT false,
  CONSTRAINT "zone_parois_zone_fk"
    FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE,
  CONSTRAINT "zone_parois_paroi_fk"
    FOREIGN KEY ("paroi_id") REFERENCES "parois"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "zone_parois_zone_id_idx" ON "zone_parois" ("zone_id");

COMMIT;
