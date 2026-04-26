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
