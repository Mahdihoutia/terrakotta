-- 2026_08_26_add_password_reset_tokens.sql
-- Ajoute la table `password_reset_tokens` — jetons à usage unique pour la
-- réinitialisation de mot de passe (flux « mot de passe oublié »).
-- Générés via /auth/forgot-password, consommés sur /auth/reset-password?token=...
--
-- À exécuter dans Supabase SQL Editor (ou psql) puis lancer `npx prisma generate`.

BEGIN;

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id"          TEXT PRIMARY KEY,
  "user_id"     TEXT NOT NULL,
  "email"       TEXT NOT NULL,
  "token"       TEXT NOT NULL,
  "expires_at"  TIMESTAMP(3) NOT NULL,
  "used_at"     TIMESTAMP(3),
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens" ("token");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens" ("user_id");

COMMIT;
