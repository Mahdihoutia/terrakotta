-- Migration manuelle — 2026-04-26
-- Feature C (#18) + Feature B (#15)
--   * Ajoute updated_at + deleted_at + index sur la table aides
--     (pour permettre soft-delete et tri par mise à jour).
--   * Ajoute la valeur 'SIMULATEUR_AIDES' à l'enum LeadSource pour les
--     leads créés depuis le simulateur public.
--
-- À passer en local : psql "$DATABASE_URL" -f prisma/migrations/_manual/2026_04_26_extend_aides_and_lead_source.sql
-- Ou via Supabase SQL Editor.
-- Après exécution :  npx prisma generate

BEGIN;

-- ─── Aides : updated_at + deleted_at + index ────────────────────
ALTER TABLE "aides"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "aides_deleted_at_idx" ON "aides" ("deleted_at");
CREATE INDEX IF NOT EXISTS "aides_projet_id_idx"  ON "aides" ("projet_id");

-- ─── LeadSource : nouvelle valeur SIMULATEUR_AIDES ─────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'SIMULATEUR_AIDES'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'LeadSource')
  ) THEN
    ALTER TYPE "LeadSource" ADD VALUE 'SIMULATEUR_AIDES';
  END IF;
END $$;

COMMIT;
