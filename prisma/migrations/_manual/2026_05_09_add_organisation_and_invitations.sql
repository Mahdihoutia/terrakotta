-- 2026_05_09_add_organisation_and_invitations.sql
-- Ajoute la table `organisation` (singleton — métadonnées du bureau utilisées
-- dans tous les exports) et `user_invitations` (magic-link pour onboarder un
-- collaborateur sans transmettre de mot de passe initial).
--
-- À exécuter dans Supabase SQL Editor (ou psql) puis lancer `npx prisma generate`.

BEGIN;

-- ─── organisation ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "organisation" (
  "id"                    TEXT PRIMARY KEY,
  "raison_sociale"        TEXT NOT NULL,
  "forme_juridique"       TEXT,
  "siret"                 TEXT,
  "code_ape"              TEXT,
  "capital"               DECIMAL(12, 2),
  "adresse"               TEXT,
  "code_postal"           TEXT,
  "ville"                 TEXT,
  "pays"                  TEXT DEFAULT 'France',
  "email"                 TEXT,
  "telephone"             TEXT,
  "site_web"              TEXT,
  "regime_tva"            TEXT,
  "mention_tva"           TEXT,
  "iban"                  TEXT,
  "bic"                   TEXT,
  "banque_nom"            TEXT,
  "rge_numero"            TEXT,
  "rge_validite_jusqu"    TIMESTAMP(3),
  "decennale_compagnie"   TEXT,
  "decennale_police"      TEXT,
  "rcp_compagnie"         TEXT,
  "rcp_police"            TEXT,
  "certifications"        JSONB,
  "logo_url"              TEXT,
  "couleur_accent"        TEXT,
  "conditions_paiement"   TEXT,
  "cgv_url"               TEXT,
  "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── user_invitations ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_invitations" (
  "id"          TEXT PRIMARY KEY,
  "email"       TEXT NOT NULL,
  "name"        TEXT,
  "role"        TEXT NOT NULL,
  "token"       TEXT NOT NULL,
  "expires_at"  TIMESTAMP(3) NOT NULL,
  "used_at"     TIMESTAMP(3),
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "invited_by"  TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_invitations_token_key" ON "user_invitations" ("token");
CREATE INDEX IF NOT EXISTS "user_invitations_email_idx" ON "user_invitations" ("email");

COMMIT;
