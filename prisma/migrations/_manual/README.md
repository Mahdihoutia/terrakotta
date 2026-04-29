# Migrations manuelles

Ce dossier contient les migrations SQL à exécuter manuellement quand
`prisma migrate dev` n'est pas envisageable (DB Supabase distante, absence
d'accès à la DB depuis l'environnement local, etc.).

## Comment passer une migration

### Option 1 — psql en local
```bash
psql "$DATABASE_URL" -f prisma/migrations/_manual/<fichier>.sql
```

### Option 2 — Supabase SQL Editor
Ouvrir le SQL editor du dashboard Supabase, copier/coller le fichier `.sql`,
exécuter, puis vérifier l'absence d'erreur.

### Après chaque migration
```bash
npx prisma generate
```

Pour intégrer ces changements à l'historique Prisma proprement, créer
ensuite une migration baseline :
```bash
npx prisma migrate resolve --applied <nom_de_la_migration>
```

## Migrations existantes
- `2026_04_25_add_roles_and_soft_delete.sql` — ajoute `users.role` (enum `Role`)
  et la colonne `deleted_at` (+ index) sur `clients`, `leads`, `projets`,
  `devis`, `documents`, `evenements`.
- `2026_04_26_add_factures.sql` — item #11 : ajoute l'enum `FactureStatut` et
  les tables `factures` / `lignes_factures` (FK vers `clients`, `projets`,
  `devis`). La colonne `factures.devis_origine_id` est unique pour garantir
  une seule facture par devis.
- `2026_04_26_add_postes_catalogue.sql` — Feature A (#19) : crée la table
  `postes_catalogue` (modèles réutilisables de lignes de devis), avec
  soft-delete (`deleted_at`) et index sur `categorie`.
- `2026_04_26_extend_aides_and_lead_source.sql` — Features C (#18) et B (#15) :
  ajoute `updated_at` / `deleted_at` (+ index) à la table `aides` pour le
  module Suivi de prime, et ajoute la valeur `SIMULATEUR_AIDES` à l'enum
  `LeadSource` pour les leads issus du simulateur public.
- `2026_04_28_add_bibliotheque_materiaux.sql` — Bibliothèque de matériaux
  (table `materiaux`) + composeur de parois multicouches (tables `parois`
  et `paroi_couches`). Crée les enums `MateriauCategorie` et `ParoiType`.
  Soft-delete (`deleted_at`) sur matériaux et parois ; suppression cascade
  des couches via FK. Après exécution, lancer `POST /api/admin/seed-materiaux`
  pour peupler la bibliothèque initiale (~80 matériaux courants).
- `2026_04_28_add_zoning_thermique.sql` — Palier #2 : zoning thermique
  multi-zones façon Pleiades. Crée l'enum `ZoneUsage` et les tables
  `batiments`, `zones`, `zone_parois`, `scenarios_occupation`. Soft-delete
  sur batiments / zones / scenarios. Cascade : zone → zone_parois,
  batiment → zones. FK vers `projets` (SET NULL) et `parois` (RESTRICT).
  Après exécution, lancer `POST /api/admin/seed-scenarios` pour peupler
  les ~6 scénarios d'occupation presets.
- `2026_04_28_add_user_deleted_at.sql` — Gestion multi-utilisateurs : ajoute
  `deleted_at` (+ index) à la table `users` pour permettre la corbeille des
  comptes. Pré-requis pour `/api/users` et l'onglet « Utilisateurs » de la
  page paramètres. Après exécution, lancer `npx tsx prisma/seeds/admin.ts
  <email> <password>` pour créer le premier utilisateur ADMIN en DB.
