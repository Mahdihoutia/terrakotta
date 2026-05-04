/**
 * Générateur PDF — Rapport d'audit projet (Kilowater).
 *
 * Sections : Cover · Sommaire · Synthèse DPE · État du bâti ·
 *            Plan de financement (aides) · Annexe méthodo.
 *
 * Réutilise les helpers de lib/pdf-styles.ts (cover, sommaire, footer,
 * étiquettes énergétiques staircase, callouts).
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PDF_COLORS,
  PDF_LAYOUT,
  COMPANY,
  drawCoverPage,
  drawSommaire,
  drawSectionHeader,
  drawEnergyLabel,
  drawCallout,
  drawFooter,
  formatDateFrPdf,
  sanitizePdfText,
  formatNumberPdf,
  resetTextState,
  type TocEntry,
} from "./pdf-styles";

export interface RapportProjetData {
  projet: {
    id: string;
    titre: string;
    reference: string;
    description: string | null;
    typeTravaux: string | null;
    adresseChantier: string | null;
    dateAudit: string;
    client: { nom: string; prenom: string | null };
  };
  surface: number;
  volume: number;

  // Synthèse DPE
  dpe?: {
    cep: number;
    ges: number;
    classe_dpe: string;
    classe_ges: string;
    classe_finale: string;
    detail: { usage: string; vecteur: string; ef_kwh: number; ep_kwh: number; co2_kg: number }[];
  };

  // Bilan thermique
  bilan: {
    gv: number;
    ubat: number;
    pertesTBase: number; // W
    besoinChauffage: number; // kWh/an net
    pctMurs: number;
    pctToiture: number;
    pctPlancher: number;
    pctVitree: number;
    pctPontsThermiques: number;
    pctVentilation: number;
    pctInfiltrations: number;
    surfaceMurs: number;
    surfaceToiture: number;
    surfacePlancher: number;
    surfaceVitree: number;
    uMurs: number;
    uToiture: number;
    uPlancher: number;
    uVitree: number;
  };

  // Bâtiments + zones
  batiments: Array<{
    nom: string;
    zoneClimatique: string;
    surface: number;
    nbZones: number;
    nbParois: number;
  }>;

  // Systèmes
  systemes: Array<{
    type: string;
    vecteur: string;
    nom: string;
    rendement: number;
    partCouverture: number;
  }>;

  // Aides (du projet ou simulées)
  aides?: {
    coutTravauxTTC: number;
    totalAides: number;
    resteACharge: number;
    ecoPtzMax: number;
    lignes: { libelle: string; montant: number; base: string }[];
  };
}

const TYPE_SYS_LABEL: Record<string, string> = {
  CHAUFFAGE: "Chauffage",
  ECS: "ECS",
  VENTILATION: "Ventilation",
  CLIMATISATION: "Climatisation",
};
const VECTEUR_SYS_LABEL: Record<string, string> = {
  ELEC: "Électricité",
  GAZ_NATUREL: "Gaz naturel",
  FIOUL: "Fioul",
  BOIS: "Bois",
  PROPANE: "Propane",
  RESEAU_CHALEUR: "Réseau chaleur",
};

export function generateRapportProjetPdf(data: RapportProjetData): Uint8Array {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  const contentW = pw - 2 * margin;

  /* ───── 1. Couverture ──────────────────────────────────────── */
  const clientName = sanitizePdfText(
    [data.projet.client.nom, data.projet.client.prenom].filter(Boolean).join(" "),
  );

  drawCoverPage(
    doc,
    "Rapport d'audit énergétique",
    sanitizePdfText(data.projet.titre),
    [
      ["Client", clientName || "—"],
      ["Adresse chantier", sanitizePdfText(data.projet.adresseChantier ?? "—")],
      ["Type de travaux", sanitizePdfText(data.projet.typeTravaux ?? "—")],
      ["Surface habitable", `${formatNumberPdf(data.surface)} m²`],
      ["Date d'édition", formatDateFrPdf(data.projet.dateAudit)],
    ],
    sanitizePdfText(data.projet.reference),
  );

  /* ───── 2. Sommaire ────────────────────────────────────────── */
  doc.addPage();
  const toc: TocEntry[] = [
    { title: "1. Synthèse énergétique", page: 3 },
    { title: "2. État du bâti existant", page: 4 },
    { title: "3. Systèmes installés", page: 5 },
    { title: "4. Plan de financement", page: 6 },
    { title: "5. Annexe méthodologique", page: 7 },
  ];
  drawSommaire(doc, toc, "Rapport d'audit énergétique", data.projet.reference);

  /* ───── 3. Synthèse énergétique ───────────────────────────── */
  doc.addPage();
  let y = drawSectionHeader(doc, "Synthèse énergétique", PDF_LAYOUT.topMargin, undefined, { number: 1 });

  if (data.dpe) {
    // Bandeau étiquettes DPE / GES
    drawEnergyLabel(doc, margin, y, {
      kind: "DPE",
      activeLetter: data.dpe.classe_dpe,
      value: `${formatNumberPdf(data.dpe.cep, { maximumFractionDigits: 0 })} kWhEP/m²·an`,
      title: "Étiquette énergie",
      width: 80,
    });
    drawEnergyLabel(doc, margin + 95, y, {
      kind: "GES",
      activeLetter: data.dpe.classe_ges,
      value: `${formatNumberPdf(data.dpe.ges, { maximumFractionDigits: 1 })} kgCO2/m²·an`,
      title: "Étiquette climat (GES)",
      width: 80,
    });

    y += 86;

    // Callout étiquette finale
    y = drawCallout(
      doc,
      "Conformément à l'arrêté DPE du 31 mars 2021, la classe finale retenue est la moins favorable des deux étiquettes énergie et climat.",
      y,
      { title: `Étiquette finale — Classe ${data.dpe.classe_finale}` },
    );
    y += 4;

    // Tableau détail par usage
    autoTable(doc, {
      startY: y,
      head: [["Usage", "Vecteur", "EF (kWh/an)", "EP (kWh/an)", "CO2 (kg/an)"]],
      body: data.dpe.detail.map((d) => [
        d.usage,
        sanitizePdfText(d.vecteur.replace(/_/g, " ")),
        formatNumberPdf(d.ef_kwh, { maximumFractionDigits: 0 }),
        formatNumberPdf(d.ep_kwh, { maximumFractionDigits: 0 }),
        formatNumberPdf(d.co2_kg, { maximumFractionDigits: 0 }),
      ]),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        textColor: PDF_COLORS.body,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: PDF_COLORS.navy,
        textColor: PDF_COLORS.white,
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: PDF_COLORS.surface },
    });
  } else {
    drawCallout(
      doc,
      "Pour calculer l'étiquette DPE, saisissez au moins un système de chauffage et d'ECS dans le module Systèmes.",
      y,
      { title: "Étiquette DPE non calculée" },
    );
  }

  /* ───── 4. État du bâti ───────────────────────────────────── */
  doc.addPage();
  y = drawSectionHeader(doc, "État du bâti existant", PDF_LAYOUT.topMargin, undefined, { number: 2 });

  // Métriques globales
  y = drawCallout(
    doc,
    `Coefficient GV ${formatNumberPdf(data.bilan.gv)} W/K · U bat ${data.bilan.ubat.toFixed(2)} W/m²·K · ` +
      `Pertes T_base ${(data.bilan.pertesTBase / 1000).toFixed(1)} kW · ` +
      `Besoin chauffage net ${formatNumberPdf(data.bilan.besoinChauffage / Math.max(data.surface, 1), { maximumFractionDigits: 0 })} kWh/m²·an`,
    y,
    { title: "Indicateurs déperditifs" },
  );
  y += 4;

  // Tableau parois
  autoTable(doc, {
    startY: y,
    head: [["Catégorie", "Surface (m²)", "U moyen (W/m²·K)", "% pertes"]],
    body: [
      ["Murs extérieurs", formatNumberPdf(data.bilan.surfaceMurs, { maximumFractionDigits: 1 }), data.bilan.uMurs.toFixed(2), `${data.bilan.pctMurs.toFixed(0)} %`],
      ["Toiture", formatNumberPdf(data.bilan.surfaceToiture, { maximumFractionDigits: 1 }), data.bilan.uToiture.toFixed(2), `${data.bilan.pctToiture.toFixed(0)} %`],
      ["Plancher bas", formatNumberPdf(data.bilan.surfacePlancher, { maximumFractionDigits: 1 }), data.bilan.uPlancher.toFixed(2), `${data.bilan.pctPlancher.toFixed(0)} %`],
      ["Vitrages", formatNumberPdf(data.bilan.surfaceVitree, { maximumFractionDigits: 1 }), data.bilan.uVitree.toFixed(2), `${data.bilan.pctVitree.toFixed(0)} %`],
      ["Ponts thermiques", "—", "—", `${data.bilan.pctPontsThermiques.toFixed(0)} %`],
      ["Ventilation (VMC)", "—", "—", `${data.bilan.pctVentilation.toFixed(0)} %`],
      ["Infiltrations", "—", "—", `${data.bilan.pctInfiltrations.toFixed(0)} %`],
    ].filter((r) => !(r[1] === "0,0" && r[3] === "0 %")),
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: PDF_COLORS.body,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: PDF_COLORS.navy,
      textColor: PDF_COLORS.white,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: PDF_COLORS.surface },
  });

  /* ───── 5. Systèmes ───────────────────────────────────────── */
  doc.addPage();
  y = drawSectionHeader(doc, "Systèmes installés", PDF_LAYOUT.topMargin, undefined, { number: 3 });

  if (data.systemes.length === 0) {
    drawCallout(
      doc,
      "La saisie des systèmes (chauffage, ECS, ventilation, climatisation) est nécessaire pour le calcul Cep.",
      y,
      { title: "Aucun système renseigné" },
    );
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Type", "Désignation", "Vecteur", "Rendement / COP", "Couverture"]],
      body: data.systemes.map((s) => [
        TYPE_SYS_LABEL[s.type] ?? s.type,
        sanitizePdfText(s.nom),
        VECTEUR_SYS_LABEL[s.vecteur] ?? s.vecteur,
        s.rendement.toFixed(2),
        `${(s.partCouverture * 100).toFixed(0)} %`,
      ]),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        textColor: PDF_COLORS.body,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: PDF_COLORS.navy,
        textColor: PDF_COLORS.white,
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: PDF_COLORS.surface },
    });
  }

  /* ───── 6. Plan de financement (aides) ────────────────────── */
  doc.addPage();
  y = drawSectionHeader(doc, "Plan de financement", PDF_LAYOUT.topMargin, undefined, { number: 4 });

  if (data.aides) {
    const a = data.aides;
    y = drawCallout(
      doc,
      `Coût travaux TTC ${formatNumberPdf(a.coutTravauxTTC, { maximumFractionDigits: 0 })} € · ` +
        `Aides cumulées ${formatNumberPdf(a.totalAides, { maximumFractionDigits: 0 })} € · ` +
        `Reste à charge ${formatNumberPdf(a.resteACharge, { maximumFractionDigits: 0 })} € · ` +
        `Eco-PTZ mobilisable jusqu'à ${formatNumberPdf(a.ecoPtzMax, { maximumFractionDigits: 0 })} €`,
      y,
      { title: "Synthèse financière" },
    );
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Aide", "Base de calcul", "Montant (€)"]],
      body: a.lignes.map((l) => [
        sanitizePdfText(l.libelle),
        sanitizePdfText(l.base),
        formatNumberPdf(l.montant, { maximumFractionDigits: 0 }),
      ]),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        textColor: PDF_COLORS.body,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: PDF_COLORS.navy,
        textColor: PDF_COLORS.white,
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: PDF_COLORS.surface },
    });
  } else {
    drawCallout(
      doc,
      "Renseignez les gestes de travaux dans l'onglet Scénarios pour obtenir une estimation MaPrimeRénov' / CEE / Eco-PTZ.",
      y,
      { title: "Aides à chiffrer" },
    );
  }

  /* ───── 7. Annexe méthodologique ──────────────────────────── */
  doc.addPage();
  y = drawSectionHeader(doc, "Annexe méthodologique", PDF_LAYOUT.topMargin, undefined, { number: 5 });
  resetTextState(doc);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.body);

  const methode = [
    "Méthode : 3CL-DPE 2021 (arrêté du 31 mars 2021) — méthode de calcul DPE pour les bâtiments à usage d'habitation existants.",
    "",
    "Déperditions : H_paroi = U × A. Le coefficient GV agrège les pertes par parois opaques, vitrages, ponts thermiques (forfait Th-U), ventilation VMC et infiltrations.",
    "",
    "Besoins chauffage : méthode DJU avec apports internes forfaitaires 5 kWh/m²·an et coefficient d'utilisation des apports gratuits selon Th-BCE 2008.",
    "",
    "Conso EF par usage : besoinNet ÷ rendement (chauffage), forfait DPE 17,78 kWh/m²·an pour l'ECS, 5 kWh/m²·an pour les auxiliaires (élec), 1,4 kWh/m²·an éclairage (élec), 12 kWh/m²·an clim si système installé.",
    "",
    "Cep = Σ (kWh EF × coefficient EP) ÷ S. Coefficients EP : élec 2,3 · gaz 1,0 · fioul 1,0 · bois 0,6 · réseau chaleur 1,0.",
    "",
    "GES = Σ (kWh EF × facteur CO2). Facteurs DPE 2021 : élec 0,079 · gaz 0,227 · fioul 0,324 · bois 0,030 · réseau chaleur 0,180 kgCO2/kWh.",
    "",
    "Étiquette finale = pire des deux étiquettes énergie et climat (règle DPE 2021 art. 4).",
    "",
    "Aides : barèmes MaPrimeRénov' 2025 (forfaits par geste, plafond global % TTC selon catégorie ressources), CEE (forfaits indicatifs offre publique), TVA 5,5 % (gestes éligibles, logement principal > 2 ans), Eco-PTZ (15/25/30 k€ selon nombre d'actions, 50 k€ rénovation globale).",
    "",
    "Limites : audit incitatif, non-réglementaire au sens du DPE certifié. Pour un DPE opposable, missionner un diagnostiqueur certifié.",
  ];

  for (const line of methode) {
    if (line === "") { y += 3; continue; }
    const wrapped = doc.splitTextToSize(line, contentW);
    if (y + wrapped.length * PDF_LAYOUT.lineHeight > PDF_LAYOUT.safeBottom) {
      doc.addPage();
      y = PDF_LAYOUT.topMargin;
    }
    doc.text(wrapped, margin, y);
    y += wrapped.length * PDF_LAYOUT.lineHeight + 1;
  }

  /* ───── Footer toutes pages (sauf cover) ──────────────────── */
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, "Rapport d'audit énergétique", data.projet.reference, i, pageCount);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
