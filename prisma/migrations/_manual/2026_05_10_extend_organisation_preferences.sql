-- 2026_05_10_extend_organisation_preferences.sql
-- Ajoute à `organisation` les préférences de numérotation (préfixes, format
-- d'année, padding) et les défauts fiscaux (TVA par défaut, délai de
-- paiement, taux de pénalité de retard) — utilisés par lib/numerotation.ts
-- et par la création de devis/factures.

BEGIN;

ALTER TABLE "organisation"
  ADD COLUMN IF NOT EXISTS "prefix_devis"          TEXT,
  ADD COLUMN IF NOT EXISTS "prefix_facture"        TEXT,
  ADD COLUMN IF NOT EXISTS "format_annee"          TEXT,
  ADD COLUMN IF NOT EXISTS "padding_numero"        INTEGER,
  ADD COLUMN IF NOT EXISTS "tva_defaut"            DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS "delai_paiement_jours"  INTEGER,
  ADD COLUMN IF NOT EXISTS "penalite_retard_taux"  DECIMAL(5, 2);

COMMIT;
