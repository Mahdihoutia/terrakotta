-- Migration manuelle — 2026-05-14
-- Ajoute le suivi d'imports asynchrones (CSV / XLSX).
-- MVP : entité "CONTACT" uniquement, mais la table est générique pour
-- supporter d'autres entités plus tard sans nouvelle migration.
--
-- À exécuter :
--   npx prisma db execute --file prisma/migrations/_manual/2026_05_14_add_import_table.sql --schema prisma/schema.prisma
-- Après :  npx prisma generate

BEGIN;

DO $$ BEGIN
  CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "imports" (
  "id"             TEXT PRIMARY KEY,
  "entity"         TEXT NOT NULL,
  "filename"       TEXT NOT NULL,
  "status"         "ImportStatus" NOT NULL DEFAULT 'PENDING',
  "total_rows"     INTEGER NOT NULL DEFAULT 0,
  "processed_rows" INTEGER NOT NULL DEFAULT 0,
  "imported_rows"  INTEGER NOT NULL DEFAULT 0,
  "skipped_rows"   INTEGER NOT NULL DEFAULT 0,
  "error_rows"     INTEGER NOT NULL DEFAULT 0,
  "errors_json"    JSONB,
  "mapping_json"   JSONB,
  "rows_json"      JSONB,
  "started_at"     TIMESTAMP(3),
  "finished_at"    TIMESTAMP(3),
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
