-- Migration manuelle — 2026-05-02
-- Ajoute la valeur BILAN_THERMIQUE à l'enum DocumentType.
-- Idempotent.
--
-- À passer via Supabase SQL Editor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'BILAN_THERMIQUE'
      AND enumtypid = '"DocumentType"'::regtype
  ) THEN
    ALTER TYPE "DocumentType" ADD VALUE 'BILAN_THERMIQUE';
  END IF;
END$$;
