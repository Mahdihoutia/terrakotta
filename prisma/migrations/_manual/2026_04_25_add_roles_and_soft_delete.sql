-- Migration manuelle — 2026-04-25
-- Items #3 (rôles utilisateurs) et #4 (soft-delete) du plan dashboard.
--
-- À passer en local avec :   psql "$DATABASE_URL" -f prisma/migrations/_manual/2026_04_25_add_roles_and_soft_delete.sql
-- Ou côté Supabase via le SQL editor.
--
-- Après exécution, lancer :  npx prisma generate
-- (déjà fait localement — utile en CI/prod après déploiement de cette migration).

BEGIN;

-- ─── Item #3 : enum Role + colonne users.role ────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'COLLABORATEUR', 'LECTURE_SEULE');
  END IF;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'ADMIN';

-- ─── Item #4 : soft-delete (deleted_at + index) ──────────────────────
ALTER TABLE "clients"    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "leads"      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "projets"    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "devis"      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "documents"  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "evenements" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "clients_deleted_at_idx"    ON "clients"    ("deleted_at");
CREATE INDEX IF NOT EXISTS "leads_deleted_at_idx"      ON "leads"      ("deleted_at");
CREATE INDEX IF NOT EXISTS "projets_deleted_at_idx"    ON "projets"    ("deleted_at");
CREATE INDEX IF NOT EXISTS "devis_deleted_at_idx"      ON "devis"      ("deleted_at");
CREATE INDEX IF NOT EXISTS "documents_deleted_at_idx"  ON "documents"  ("deleted_at");
CREATE INDEX IF NOT EXISTS "evenements_deleted_at_idx" ON "evenements" ("deleted_at");

COMMIT;
