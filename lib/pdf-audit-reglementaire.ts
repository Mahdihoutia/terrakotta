/**
 * Générateur PDF — Audit énergétique réglementaire.
 *
 * Structure imposée :
 *   • Tertiaire (arrêté 30 avril 2022) : 3 scénarios de travaux, gains 25-40 %,
 *     40-60 %, > 60 %, avec coûts / aides / ROI / phasage.
 *   • Résidentiel collectif (cahier ADEME arrêté 4 mai 2018) : audit thermique
 *     détaillé avec au moins 3 scénarios chiffrés + plan de financement.
 *
 * Sections :
 *   1. Contexte de la mission
 *   2. Présentation du site
 *   3. État actuel (bilan thermique + DPE + GES)
 *   4. Solutions d'amélioration — 3 scénarios obligatoires
 *   5. Plan de financement
 *   6. Phasage et mise en œuvre
 *   7. Signature
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PDF_COLORS,
  PDF_LAYOUT,
  drawCoverPage,
  drawSommaire,
  drawSectionHeader,
  drawFooter,
  getInfoTableConfig,
  sanitizePdfText,
  formatNumberPdf,
  needsPageBreak,
  type TocEntry,
} from "./pdf-styles";
import type { AuditReglementaireData, ScenarioAudit } from "./audit-reglementaire-data";

const CATEGORIE_LABEL = {
  TERTIAIRE: "Bâtiment tertiaire",
  RESIDENTIEL_COLLECTIF: "Résidentiel collectif",
} as const;

const REFERENCE_REGLEMENTAIRE = {
  TERTIAIRE: "arrêté du 30 avril 2022 relatif au contenu de l'audit énergétique",
  RESIDENTIEL_COLLECTIF:
    "cahier des charges ADEME (arrêté du 4 mai 2018) pour l'audit énergétique des bâtiments collectifs d'habitation",
} as const;

function fmt(n: number | null | undefined, dec = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  return formatNumberPdf(n, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function euro(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${formatNumberPdf(Math.round(n))} €`;
}

function pct(n: number | null | undefined, dec = 1): string {
  if (n == null) return "—";
  return `${fmt(n, dec)} %`;
}

function iso(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function generateAuditReglementairePdf(data: AuditReglementaireData): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pw = doc.internal.pageSize.getWidth();
  const contentW = pw - PDF_LAYOUT.margin * 2;
  const tocPages: TocEntry[] = [];

  // ─── Cover ─────────────────────────────────────────────
  drawCoverPage(
    doc,
    "Audit énergétique réglementaire",
    `${CATEGORIE_LABEL[data.categorie]}\nRéalisé conformément à ${REFERENCE_REGLEMENTAIRE[data.categorie]}`,
    [
      ["Site", `${data.siteNom} — ${data.adresse}, ${data.codePostal} ${data.ville}`],
      ["Client / Titulaire", data.clientTitulaire],
      ["Surface chauffée", `${fmt(data.surfaceChauffee)} m²`],
      ["Zone climatique", data.zoneClimatique],
      ["Consommation actuelle (Cep)", `${fmt(data.cepBaselineKwhEpM2)} kWhEP/m²/an`],
      ["Classe DPE actuelle", `${data.dpeBaseline} — GES ${data.gesClasseBaseline}`],
      ["Date d'émission", iso(data.dateEmission)],
      ["Rédigé par", data.auteur],
    ],
    data.reference,
  );

  // Sommaire (placeholder)
  doc.addPage();
  const tocPage = doc.getCurrentPageInfo().pageNumber;

  const addSection = (title: string) => {
    doc.addPage();
    tocPages.push({ title, page: doc.getCurrentPageInfo().pageNumber });
    return drawSectionHeader(doc, title, PDF_LAYOUT.topMargin);
  };

  // ─── 1. Contexte ─────────────────────────────────────
  {
    let y = addSection("1. Contexte de la mission");
    y = drawProse(
      doc,
      `La présente mission d'audit énergétique porte sur ${data.siteNom.toLowerCase()}, ` +
        `${data.adresse}, ${data.codePostal} ${data.ville}, d'une surface chauffée de ` +
        `${fmt(data.surfaceChauffee)} m². Elle est réalisée conformément aux exigences du ` +
        `${REFERENCE_REGLEMENTAIRE[data.categorie]}.\n\n` +
        `Objectifs de l'audit :\n` +
        `— Établir l'état actuel des consommations énergétiques et des émissions de GES.\n` +
        `— Identifier les leviers d'amélioration prioritaires.\n` +
        `— Proposer trois scénarios de travaux chiffrés (gains 25-40 %, 40-60 %, > 60 %) ` +
        `avec plan de financement et phasage recommandé.`,
      y + 2,
    );
  }

  // ─── 2. Présentation du site ────────────────────────
  {
    let y = addSection("2. Présentation du site");
    autoTable(doc, {
      ...getInfoTableConfig(
        y + 2,
        [["Rubrique", "Valeur"]],
        [
          ["Adresse", `${data.adresse}, ${data.codePostal} ${data.ville}`],
          ["Client / Titulaire", data.clientTitulaire],
          ["Catégorie", CATEGORIE_LABEL[data.categorie]],
          ["Surface chauffée", `${fmt(data.surfaceChauffee)} m²`],
          ["Zone climatique", data.zoneClimatique],
          [
            "Année de construction",
            data.anneeConstruction != null ? String(data.anneeConstruction) : "—",
          ],
        ],
        contentW,
      ),
    });
  }

  // ─── 3. État actuel ─────────────────────────────────
  {
    let y = addSection("3. État actuel — Bilan thermique et énergétique");
    y = drawProse(
      doc,
      `L'état actuel du bâtiment a été établi à partir de la saisie détaillée de l'enveloppe ` +
        `(parois, ponts thermiques, menuiseries) et des systèmes énergétiques en place (chauffage, ` +
        `ECS, ventilation). Les indicateurs Cep, Cef et GES ci-dessous sont calculés selon la même ` +
        `chaîne que le calcul DPE réglementaire.`,
      y + 2,
    );
    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Indicateur", "Valeur"]],
        [
          [
            "Consommation en énergie primaire (Cep)",
            `${fmt(data.indicateursBaseline.cep)} kWhEP/m²/an`,
          ],
          [
            "Consommation en énergie finale (Cef)",
            `${fmt(data.indicateursBaseline.cef)} kWhEF/m²/an`,
          ],
          [
            "Émissions de GES",
            `${fmt(data.indicateursBaseline.ges, 1)} kgCO2/m²/an`,
          ],
          ["Classe DPE", data.dpeBaseline],
          ["Classe GES", data.gesClasseBaseline],
          [
            "Besoin de chauffage net",
            `${fmt(data.indicateursBaseline.besoinChauffage)} kWh/m²/an`,
          ],
          [
            "Besoin d'ECS net",
            `${fmt(data.indicateursBaseline.besoinECS)} kWh/m²/an`,
          ],
          [
            "Coefficient GV (déperditions totales)",
            `${fmt(data.indicateursBaseline.gv, 1)} W/K`,
          ],
        ],
        contentW,
      ),
    });
  }

  // ─── 4. Scénarios ───────────────────────────────────
  {
    let y = addSection("4. Solutions d'amélioration — 3 scénarios obligatoires");
    y = drawProse(
      doc,
      `Conformément à la réglementation, trois scénarios de travaux sont présentés, correspondant ` +
        `à des niveaux de gains croissants. Chaque scénario est chiffré (coût, aides, reste à charge, ` +
        `temps de retour) et évalué en indicateurs post-travaux.`,
      y + 2,
    );

    for (const sc of data.scenarios) {
      drawScenario(doc, sc, data);
    }
  }

  // ─── 5. Plan de financement ─────────────────────────
  {
    let y = addSection("5. Plan de financement — comparaison scénarios");
    autoTable(doc, {
      ...getInfoTableConfig(
        y + 2,
        [
          [
            "Scénario",
            "Coût HT",
            "Prime CEE",
            "MPR",
            "Autres aides",
            "Reste à charge",
            "TRI",
          ],
        ],
        data.scenarios.map((sc) => [
          `S${sc.code} — ${sc.cible}`,
          euro(sc.coutTotalHT),
          euro(sc.primeCeeEstimee),
          euro(sc.primeMprEstimee),
          euro(sc.autresAides),
          euro(sc.resteACharge),
          sc.tempsRetourAns != null ? `${fmt(sc.tempsRetourAns, 1)} ans` : "—",
        ]),
        contentW,
      ),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right", fontStyle: "bold" },
        6: { halign: "right" },
      },
    });
  }

  // ─── 6. Phasage ─────────────────────────────────────
  {
    let y = addSection("6. Phasage et mise en œuvre");
    y = drawProse(
      doc,
      `Le phasage recommandé dépend du budget disponible et de la stratégie du maître d'ouvrage. ` +
        `Trois logiques types :\n\n` +
        `— Phasage économique : commencer par le scénario 1 (gains 25-40 %, ROI court), puis ` +
        `capitaliser les économies pour financer un geste supplémentaire tous les 3-5 ans.\n\n` +
        `— Phasage réglementaire : cibler directement le scénario 2 ou 3 pour respecter les ` +
        `échéances Décret Tertiaire (−40 % en 2030) ou les objectifs bas carbone.\n\n` +
        `— Phasage global : opération unique en scénario 3 (rénovation performante BBC) pour ` +
        `maximiser la valeur patrimoniale et bénéficier des bonifications d'aides sur bouquets.`,
      y + 2,
    );
  }

  // ─── 7. Signature ───────────────────────────────────
  {
    let y = addSection("7. Signature");
    y = drawProse(
      doc,
      `La présente note d'audit énergétique engage Kilowater sur l'exactitude méthodologique des ` +
        `calculs, aux conditions décrites (données saisies, moteur thermique employé). Elle constitue ` +
        `le livrable réglementaire prévu par le ${REFERENCE_REGLEMENTAIRE[data.categorie]}.`,
      y + 2,
    );
    y += 20;
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(PDF_LAYOUT.margin, y, PDF_LAYOUT.margin + 70, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(data.auteur, PDF_LAYOUT.margin, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(
      `Fait le ${iso(data.dateEmission)} — Kilowater · Bureau d'étude en rénovation énergétique`,
      PDF_LAYOUT.margin,
      y + 11,
    );
  }

  // ─── Sommaire post-hoc ───────────────────────────────
  doc.setPage(tocPage);
  drawSommaire(doc, tocPages, "Audit énergétique réglementaire", data.reference);

  // ─── Footers ─────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Audit énergétique réglementaire", data.reference, i, totalPages);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

function drawScenario(
  doc: jsPDF,
  sc: ScenarioAudit,
  data: AuditReglementaireData,
): void {
  const pw = doc.internal.pageSize.getWidth();
  const contentW = pw - PDF_LAYOUT.margin * 2;
  const posBefore = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY ?? PDF_LAYOUT.topMargin + 20;
  let y = posBefore + 8;
  if (needsPageBreak(y, 50)) {
    doc.addPage();
    y = PDF_LAYOUT.topMargin;
  }

  // Bandeau titre scénario
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(PDF_LAYOUT.margin, y, contentW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(sanitizePdfText(sc.titre), PDF_LAYOUT.margin + 4, y + 5.5);
  y += 12;

  // Description
  y = drawProse(doc, sc.description, y);
  y += 2;

  // Tableau indicateurs
  autoTable(doc, {
    ...getInfoTableConfig(
      y,
      [["Indicateur", "Baseline", "Après", "Gain"]],
      [
        [
          "Cep (kWhEP/m²/an)",
          fmt(data.indicateursBaseline.cep),
          fmt(sc.indicateurs.cep),
          `−${fmt(sc.gainCepPct, 1)} %`,
        ],
        [
          "Cef (kWhEF/m²/an)",
          fmt(data.indicateursBaseline.cef),
          fmt(sc.indicateurs.cef),
          `−${fmt(sc.gainCefPct, 1)} %`,
        ],
        [
          "GES (kgCO2/m²/an)",
          fmt(data.indicateursBaseline.ges, 1),
          fmt(sc.indicateurs.ges, 1),
          `−${fmt(sc.gainGesPct, 1)} %`,
        ],
        [
          "DPE",
          data.dpeBaseline,
          sc.indicateurs.dpe,
          data.dpeBaseline !== sc.indicateurs.dpe ? "amélioré" : "—",
        ],
        [
          "Besoin chauffage (kWh/m²/an)",
          fmt(data.indicateursBaseline.besoinChauffage),
          fmt(sc.indicateurs.besoinChauffage),
          "—",
        ],
      ],
      contentW,
    ),
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { halign: "right", cellWidth: (contentW - 60) / 3 },
      2: { halign: "right", cellWidth: (contentW - 60) / 3 },
      3: { halign: "right", cellWidth: (contentW - 60) / 3, fontStyle: "bold" },
    },
  });
  const yAfterTable1 =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;

  // Tableau gestes
  if (sc.gestes.length > 0) {
    autoTable(doc, {
      ...getInfoTableConfig(
        yAfterTable1 + 4,
        [["Geste", "Quantité", "Coût HT"]],
        [
          ...sc.gestes.map((g) => [g.nom, String(g.quantite), euro(g.coutHT)]),
          ["Total travaux", "—", euro(sc.coutTotalHT)],
        ],
        contentW,
      ),
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right" },
        2: { halign: "right", fontStyle: "bold" },
      },
    });
  }

  const yAfterTable2 =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yAfterTable1;

  // Encart financier
  autoTable(doc, {
    ...getInfoTableConfig(
      yAfterTable2 + 4,
      [["Financement", "Valeur"]],
      [
        ["Prime CEE estimée", euro(sc.primeCeeEstimee)],
        ["MaPrimeRénov'", euro(sc.primeMprEstimee)],
        ["Autres aides", euro(sc.autresAides)],
        ["Total des aides", euro(sc.aideTotale)],
        ["Reste à charge", euro(sc.resteACharge)],
        ["Économie annuelle estimée", euro(sc.economieAnnuelleEuros)],
        [
          "Temps de retour brut",
          sc.tempsRetourAns != null ? `${fmt(sc.tempsRetourAns, 1)} ans` : "—",
        ],
      ],
      contentW,
    ),
  });
}

function drawProse(doc: jsPDF, raw: string, startY: number): number {
  const pw = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  const width = pw - margin * 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.body);
  const clean = sanitizePdfText(raw);
  const lines = doc.splitTextToSize(clean, width) as string[];
  let y = startY;
  for (const line of lines) {
    if (needsPageBreak(y, 5)) {
      doc.addPage();
      y = PDF_LAYOUT.topMargin;
    }
    doc.text(line, margin, y + 4);
    y += 4.6;
  }
  return y;
}
