-- Migration manuelle — 2026-05-05
-- Photovoltaïque autoconsommation (Systeme.type PHOTOVOLTAIQUE).

BEGIN;

-- Étend l'enum SystemeType avec PHOTOVOLTAIQUE
ALTER TYPE "SystemeType" ADD VALUE IF NOT EXISTS 'PHOTOVOLTAIQUE';

-- Colonnes PV
ALTER TABLE "systemes"
  ADD COLUMN IF NOT EXISTS "puissance_kwc"   NUMERIC(65, 30),
  ADD COLUMN IF NOT EXISTS "taux_autoconso"  NUMERIC(65, 30);

COMMIT;
