import type { Lead } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  CONTACTE: "Contacté",
  QUALIFIE: "Qualifié",
  PROPOSITION: "Proposition",
  GAGNE: "Gagné",
  PERDU: "Perdu",
};

const SOURCE_LABELS: Record<string, string> = {
  SITE_WEB: "Site web",
  RECOMMANDATION: "Recommandation",
  RESEAU: "Réseau",
  DEMARCHAGE: "Démarchage",
  AUTRE: "Autre",
};

const TYPE_LABELS: Record<string, string> = {
  PARTICULIER: "Particulier",
  PROFESSIONNEL: "Professionnel",
  COLLECTIVITE: "Collectivité",
};

/** All possible columns in display order */
const ALL_COLUMNS: { key: keyof Lead | "_type" | "_source" | "_statut" | "_budget"; label: string; getValue: (l: Lead) => string | number | undefined }[] = [
  { key: "nom", label: "Nom", getValue: (l) => l.nom },
  { key: "prenom", label: "Prénom", getValue: (l) => l.prenom },
  { key: "email", label: "Email", getValue: (l) => l.email },
  { key: "telephone", label: "Téléphone", getValue: (l) => l.telephone },
  { key: "raisonSociale", label: "Raison Sociale", getValue: (l) => l.raisonSociale },
  { key: "siret", label: "N° SIRET", getValue: (l) => l.siret },
  { key: "fonction", label: "Fonction", getValue: (l) => l.fonction },
  { key: "_type", label: "Type", getValue: (l) => TYPE_LABELS[l.type] || l.type },
  { key: "_source", label: "Source", getValue: (l) => SOURCE_LABELS[l.source] || l.source },
  { key: "_statut", label: "Statut", getValue: (l) => STATUS_LABELS[l.statut] || l.statut },
  { key: "_budget", label: "Budget estimé (€)", getValue: (l) => l.budgetEstime },
  { key: "dateCreation", label: "Date création", getValue: (l) => l.dateCreation },
  { key: "notes", label: "Notes", getValue: (l) => l.notes },
];

/** Returns only columns that have at least one non-empty value across all leads */
function getActiveColumns(leads: Lead[]) {
  return ALL_COLUMNS.filter((col) =>
    leads.some((l) => {
      const v = col.getValue(l);
      return v !== undefined && v !== null && v !== "";
    }),
  );
}

function formatRows(leads: Lead[]) {
  const cols = getActiveColumns(leads);
  return leads.map((lead) => {
    const row: Record<string, string | number> = {};
    for (const col of cols) {
      const v = col.getValue(lead);
      row[col.label] = v ?? "";
    }
    return row;
  });
}

export async function exportToExcel(leads: Lead[], filename = "leads-kilowater") {
  const XLSX = await import("xlsx");
  const rows = formatRows(leads);
  const cols = getActiveColumns(leads);
  const ws = XLSX.utils.json_to_sheet(rows);

  ws["!cols"] = cols.map(() => ({ wch: 22 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** PDF-specific columns (subset for readability) */
const PDF_COLUMNS: { label: string; getValue: (l: Lead) => string | undefined }[] = [
  { label: "Nom", getValue: (l) => l.nom },
  { label: "Email", getValue: (l) => l.email },
  { label: "Tél.", getValue: (l) => l.telephone },
  { label: "Type", getValue: (l) => TYPE_LABELS[l.type] || l.type },
  { label: "Source", getValue: (l) => SOURCE_LABELS[l.source] || l.source },
  { label: "Statut", getValue: (l) => STATUS_LABELS[l.statut] || l.statut },
  { label: "Budget €", getValue: (l) => l.budgetEstime ? new Intl.NumberFormat("fr-FR").format(l.budgetEstime) : undefined },
  { label: "Date", getValue: (l) => l.dateCreation },
];

export async function exportToPdf(leads: Lead[], filename = "leads-kilowater") {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(18);
  doc.text("Kilowater — Leads", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")} — ${leads.length} leads`, 14, 28);

  // Keep only columns that have at least one non-empty value
  const activeCols = PDF_COLUMNS.filter((col) =>
    leads.some((l) => {
      const v = col.getValue(l);
      return v !== undefined && v !== null && v !== "";
    }),
  );

  const headers = activeCols.map((c) => c.label);
  const rows = leads.map((l) => activeCols.map((c) => c.getValue(l) || ""));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 34,
    theme: "grid",
    headStyles: { fillColor: [224, 122, 95], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${filename}.pdf`);
}
