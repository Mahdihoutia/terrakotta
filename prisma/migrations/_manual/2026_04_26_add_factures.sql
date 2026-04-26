-- Migration manuelle — 2026-04-26
-- Item #11 : conversion Devis → Facture en 1 clic.
-- Ajoute :
--   * enum FactureStatut
--   * tables factures + lignes_factures (FK vers clients, projets, devis)
--   * unique sur factures.devis_origine_id (1 facture max par devis)
--
-- À passer en local : psql "$DATABASE_URL" -f prisma/migrations/_manual/2026_04_26_add_factures.sql
-- Ou via Supabase SQL Editor.
-- Après exécution :  npx prisma generate

BEGIN;

-- ─── Enum FactureStatut ──────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FactureStatut') THEN
    CREATE TYPE "FactureStatut" AS ENUM (
      'BROUILLON',
      'EMISE',
      'PAYEE_PARTIELLEMENT',
      'PAYEE',
      'EN_RETARD',
      'ANNULEE'
    );
  END IF;
END $$;

-- ─── Table factures ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "factures" (
  "id"               TEXT PRIMARY KEY,
  "numero"           TEXT NOT NULL UNIQUE,
  "objet"            TEXT,
  "statut"           "FactureStatut" NOT NULL DEFAULT 'BROUILLON',
  "montant_ht"       DECIMAL(65, 30) NOT NULL,
  "taux_tva"         DECIMAL(65, 30) NOT NULL DEFAULT 20,
  "date_emis"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_echeance"    TIMESTAMP(3),
  "date_paiement"    TIMESTAMP(3),
  "mode_paiement"    TEXT,
  "reference"        TEXT,
  "client_id"        TEXT NOT NULL REFERENCES "clients"("id"),
  "projet_id"        TEXT REFERENCES "projets"("id"),
  "devis_origine_id" TEXT UNIQUE REFERENCES "devis"("id"),
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"       TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "factures_deleted_at_idx" ON "factures" ("deleted_at");
CREATE INDEX IF NOT EXISTS "factures_client_id_idx"  ON "factures" ("client_id");

-- ─── Table lignes_factures ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "lignes_factures" (
  "id"           TEXT PRIMARY KEY,
  "facture_id"   TEXT NOT NULL REFERENCES "factures"("id") ON DELETE CASCADE,
  "designation"  TEXT NOT NULL,
  "unite"        TEXT NOT NULL DEFAULT 'U',
  "quantite"     DECIMAL(65, 30) NOT NULL DEFAULT 1,
  "prix_unit_ht" DECIMAL(65, 30) NOT NULL,
  "taux_tva"     DECIMAL(65, 30) NOT NULL DEFAULT 20,
  "ordre"        INTEGER NOT NULL DEFAULT 0
);

COMMIT;
