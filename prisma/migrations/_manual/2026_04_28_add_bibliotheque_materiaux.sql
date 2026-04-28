-- Migration manuelle — 2026-04-28
-- Bibliothèque de matériaux + composeur de parois multicouches.
-- Crée les enums MateriauCategorie / ParoiType et les tables
-- materiaux, parois, paroi_couches.
--
-- À passer en local : psql "$DATABASE_URL" -f prisma/migrations/_manual/2026_04_28_add_bibliotheque_materiaux.sql
-- Ou via Supabase SQL Editor.
-- Après exécution :  npx prisma generate

BEGIN;

-- Enums (idempotents) -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MateriauCategorie') THEN
    CREATE TYPE "MateriauCategorie" AS ENUM (
      'STRUCTURE', 'ISOLANT', 'FINITION', 'VITRAGE', 'LAME_AIR', 'MEMBRANE', 'AUTRE'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ParoiType') THEN
    CREATE TYPE "ParoiType" AS ENUM (
      'MUR_EXT', 'MUR_INT', 'TOITURE', 'PLANCHER_BAS', 'PLANCHER_INTER', 'VITRAGE', 'PORTE'
    );
  END IF;
END$$;

-- Table materiaux -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "materiaux" (
  "id"                  TEXT PRIMARY KEY,
  "nom"                 TEXT NOT NULL,
  "categorie"           "MateriauCategorie" NOT NULL,
  "marque"              TEXT,
  "reference"           TEXT,
  "conductivite"        DECIMAL(65, 30) NOT NULL,
  "masse_volumique"     DECIMAL(65, 30) NOT NULL,
  "capacite_thermique"  DECIMAL(65, 30) NOT NULL,
  "resistance_vapeur"   DECIMAL(65, 30),
  "resistance_fixe"     DECIMAL(65, 30),
  "carbone_acv"         DECIMAL(65, 30),
  "carbone_fin_de_vie"  DECIMAL(65, 30),
  "origine_fdes"        TEXT,
  "source"              TEXT,
  "notes"               TEXT,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"          TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "materiaux_deleted_at_idx" ON "materiaux" ("deleted_at");
CREATE INDEX IF NOT EXISTS "materiaux_categorie_idx"  ON "materiaux" ("categorie");

-- Table parois --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "parois" (
  "id"                       TEXT PRIMARY KEY,
  "nom"                      TEXT NOT NULL,
  "type"                     "ParoiType" NOT NULL,
  "description"              TEXT,
  "u_cache"                  DECIMAL(65, 30),
  "r_cache"                  DECIMAL(65, 30),
  "masse_surfacique_cache"   DECIMAL(65, 30),
  "dephasage_cache"          DECIMAL(65, 30),
  "carbone_cache"            DECIMAL(65, 30),
  "rsi"                      DECIMAL(65, 30) NOT NULL DEFAULT 0.13,
  "rse"                      DECIMAL(65, 30) NOT NULL DEFAULT 0.04,
  "created_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"               TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "parois_deleted_at_idx" ON "parois" ("deleted_at");
CREATE INDEX IF NOT EXISTS "parois_type_idx"       ON "parois" ("type");

-- Table paroi_couches -------------------------------------------------------
CREATE TABLE IF NOT EXISTS "paroi_couches" (
  "id"          TEXT PRIMARY KEY,
  "paroi_id"    TEXT NOT NULL,
  "materiau_id" TEXT NOT NULL,
  "ordre"       INTEGER NOT NULL,
  "epaisseur"   DECIMAL(65, 30) NOT NULL,
  CONSTRAINT "paroi_couches_paroi_fk"
    FOREIGN KEY ("paroi_id") REFERENCES "parois"("id") ON DELETE CASCADE,
  CONSTRAINT "paroi_couches_materiau_fk"
    FOREIGN KEY ("materiau_id") REFERENCES "materiaux"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "paroi_couches_paroi_id_idx" ON "paroi_couches" ("paroi_id");

COMMIT;
