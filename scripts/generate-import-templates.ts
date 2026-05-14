import * as XLSX from "xlsx";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Génère les fichiers .xlsx servant de modèles d'import.
 * Exécuter : `npx tsx scripts/generate-import-templates.ts`
 */

const contacts = [
  ["Nom", "Prénom", "Email", "Téléphone", "Société", "Poste", "Notes"],
  [
    "Dupont",
    "Marie",
    "marie.dupont@acme-immobilier.fr",
    "+33 1 23 45 67 89",
    "ACME Immobilier",
    "Directrice technique",
    "Copro 45 lots — Audit prévu Q3",
  ],
  [
    "Martin",
    "Jean",
    "j.martin@mairie-courbevoie.fr",
    "+33 1 47 88 12 34",
    "Mairie de Courbevoie",
    "Responsable bâtiments",
    "Plan de sobriété 2026 — DEET assujetti",
  ],
];

const outDir = resolve(process.cwd(), "public/templates");
mkdirSync(outDir, { recursive: true });

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(contacts);
ws["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 32 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, ws, "Contacts");
const outPath = resolve(outDir, "contacts-import-template.xlsx");
const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
writeFileSync(outPath, buf);
console.log(`✓ ${outPath}`);
