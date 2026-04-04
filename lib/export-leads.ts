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

function formatRow(lead: Lead) {
  return {
    Nom: lead.nom,
    Prénom: lead.prenom || "",
    Email: lead.email,
    Téléphone: lead.telephone || "",
    "Raison Sociale": lead.raisonSociale || "",
    "N° SIRET": lead.siret || "",
    Type: TYPE_LABELS[lead.type] || lead.type,
    Source: SOURCE_LABELS[lead.source] || lead.source,
    Statut: STATUS_LABELS[lead.statut] || lead.statut,
    "Budget estimé (€)": lead.budgetEstime ?? "",
    "Date création": lead.dateCreation,
    Notes: lead.notes || "",
  };
}

export async function exportToExcel(leads: Lead[], filename = "leads-terrakotta") {
  const XLSX = await import("xlsx");
  const rows = leads.map(formatRow);
  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 20 },
    { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 16 },
    { wch: 14 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportToPdf(leads: Lead[], filename = "leads-terrakotta") {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(18);
  doc.text("Terrakotta — Leads", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")} — ${leads.length} leads`, 14, 28);

  const headers = ["Nom", "Email", "Tél.", "Type", "Source", "Statut", "Budget €", "Date"];
  const rows = leads.map((l) => [
    l.nom,
    l.email,
    l.telephone || "—",
    TYPE_LABELS[l.type] || l.type,
    SOURCE_LABELS[l.source] || l.source,
    STATUS_LABELS[l.statut] || l.statut,
    l.budgetEstime ? new Intl.NumberFormat("fr-FR").format(l.budgetEstime) : "—",
    l.dateCreation,
  ]);

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
