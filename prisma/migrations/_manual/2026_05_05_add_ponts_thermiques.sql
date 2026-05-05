-- Migration manuelle — 2026-05-05
-- Ponts thermiques détaillés au niveau bâtiment (Th-U fascicule 5/5).

BEGIN;

DO $$ BEGIN
  CREATE TYPE "TypeLiaison" AS ENUM (
    'MUR_DALLE_INTERMEDIAIRE','MUR_PLANCHER_BAS','MUR_TOITURE','MUR_REFEND',
    'MENUISERIE_TUNNEL','MENUISERIE_NU_INTERIEUR','MENUISERIE_NU_EXTERIEUR',
    'BALCON_NON_ROMPU','BALCON_RUPTEUR'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TypeIsolation" AS ENUM ('ITE','ITI','ITR','Aucune');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "ponts_thermiques_liaisons" (
  "id"           TEXT             PRIMARY KEY,
  "batiment_id"  TEXT             NOT NULL,
  "typo"         "TypeLiaison"    NOT NULL,
  "isolation"    "TypeIsolation"  NOT NULL DEFAULT 'Aucune',
  "longueur"     NUMERIC(65, 30)  NOT NULL,
  "psi_override" NUMERIC(65, 30),
  "notes"        TEXT,
  "created_at"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"   TIMESTAMP(3),
  CONSTRAINT "ponts_thermiques_liaisons_batiment_id_fkey"
    FOREIGN KEY ("batiment_id") REFERENCES "batiments"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ponts_thermiques_liaisons_batiment_id_idx" ON "ponts_thermiques_liaisons"("batiment_id");
CREATE INDEX IF NOT EXISTS "ponts_thermiques_liaisons_deleted_at_idx" ON "ponts_thermiques_liaisons"("deleted_at");

COMMIT;
