-- Migration manuelle — 2026-04-26
-- Feature A (#19) : bibliothèque de modèles de postes de devis.
-- Crée la table postes_catalogue (réutilisable dans Devis et DevisDocument).
--
-- À passer en local : psql "$DATABASE_URL" -f prisma/migrations/_manual/2026_04_26_add_postes_catalogue.sql
-- Ou via Supabase SQL Editor.
-- Après exécution :  npx prisma generate

BEGIN;

CREATE TABLE IF NOT EXISTS "postes_catalogue" (
  "id"           TEXT PRIMARY KEY,
  "designation"  TEXT NOT NULL,
  "categorie"    TEXT,
  "unite"        TEXT NOT NULL DEFAULT 'U',
  "prix_unit_ht" DECIMAL(65, 30) NOT NULL,
  "taux_tva"     DECIMAL(65, 30) NOT NULL DEFAULT 20,
  "description"  TEXT,
  "ordre"        INTEGER NOT NULL DEFAULT 0,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"   TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "postes_catalogue_deleted_at_idx" ON "postes_catalogue" ("deleted_at");
CREATE INDEX IF NOT EXISTS "postes_catalogue_categorie_idx"  ON "postes_catalogue" ("categorie");

COMMIT;
