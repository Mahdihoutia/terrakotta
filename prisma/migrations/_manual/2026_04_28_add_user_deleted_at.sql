-- 2026_04_28_add_user_deleted_at.sql
-- Active la gestion multi-utilisateurs avec soft-delete sur la table users.
-- À exécuter dans Supabase SQL Editor (ou via psql) puis lancer `npx prisma generate`.

BEGIN;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users" ("deleted_at");

COMMIT;
