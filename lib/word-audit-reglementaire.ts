/**
 * Générateur Word (.docx) — Audit énergétique réglementaire.
 * Pendant du PDF (lib/pdf-audit-reglementaire.ts) : même AuditReglementaireData.
 */

import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  TableLayoutType,
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
} from "docx";
import type {
  AuditReglementaireData,
  CategorieAudit,
  ScenarioAudit,
} from "./audit-reglementaire-data";

const ACCENT = "2563EB";
const BRAND_NAVY = "0D1B35";
const BRAND_LIGHT = "60A5FA";
const MUTED = "64748B";
const SURFACE = "F8FAFC";

const CATEGORIE_LABEL: Record<CategorieAudit, string> = {
  TERTIAIRE: "Bâtiment tertiaire",
  RESIDENTIEL_COLLECTIF: "Résidentiel collectif",
};
const REFERENCE_REGLEMENTAIRE: Record<CategorieAudit, string> = {
  TERTIAIRE: "arrêté du 30 avril 2022 relatif au contenu de l'audit énergétique",
  RESIDENTIEL_COLLECTIF:
    "cahier des charges ADEME (arrêté du 4 mai 2018) pour l'audit des bâtiments collectifs",
};

function fmt(n: number | null | undefined, dec = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}
function euro(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${fmt(Math.round(n))} €`;
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

const thin = { style: BorderStyle.SINGLE, size: 4, color: "D6D3D1" };
const tableBorders = {
  top: thin,
  bottom: thin,
  left: thin,
  right: thin,
  insideHorizontal: thin,
  insideVertical: thin,
};
const noneBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = {
  top: noneBorder,
  bottom: noneBorder,
  left: noneBorder,
  right: noneBorder,
  insideHorizontal: noneBorder,
  insideVertical: noneBorder,
};

function cell(
  text: string,
  opts: {
    bold?: boolean;
    fill?: string;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    size?: number;
  } = {},
): TableCell {
  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.fill
      ? { type: ShadingType.CLEAR, color: "auto", fill: opts.fill }
      : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text,
            bold: opts.bold,
            size: opts.size ?? 18,
            color: opts.color ?? BRAND_NAVY,
          }),
        ],
      }),
    ],
  });
}

function sectionTitle(idx: number, titre: string): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 320, after: 80 },
      children: [
        new TextRun({
          text: `SECTION ${String(idx).padStart(2, "0")}`,
          bold: true,
          size: 14,
          color: ACCENT,
          characterSpacing: 100,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({ text: titre, bold: true, size: 32, color: BRAND_NAVY }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 200 },
      border: {
        bottom: { color: ACCENT, size: 6, style: BorderStyle.SINGLE, space: 1 },
      },
      children: [],
    }),
  ];
}

function prose(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: 120, line: 320 },
    children: [new TextRun({ text, size: 20, color: BRAND_NAVY })],
  });
}

function kvTable(rows: Array<{ label: string; value: string; highlight?: boolean }>): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
    columnWidths: [3840, 5760],
    rows: rows.map(
      ({ label, value, highlight }) =>
        new TableRow({
          cantSplit: true,
          children: [
            cell(label, { bold: true, fill: SURFACE, color: MUTED }),
            cell(value || "—", { fill: highlight ? "DCFCE7" : undefined }),
          ],
        }),
    ),
  });
}

function dataTable(headers: string[], rows: string[][]): Table {
  const total = 9600;
  const widths = Array.from({ length: headers.length }, () =>
    Math.round(total / headers.length),
  );
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h) =>
      cell(h, { bold: true, fill: BRAND_NAVY, color: "FFFFFF" }),
    ),
  });
  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        cantSplit: true,
        children: r.map((c, colIdx) =>
          cell(c, { align: colIdx === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT }),
        ),
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
    columnWidths: widths,
    rows: [headerRow, ...bodyRows],
  });
}

function scenarioBlock(sc: ScenarioAudit, data: AuditReglementaireData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  // Bandeau scénario
  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [9600],
      borders: noBorders,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: ACCENT },
              margins: { top: 120, bottom: 120, left: 200, right: 200 },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({
                      text: sc.titre,
                      bold: true,
                      size: 24,
                      color: "FFFFFF",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );
  out.push(new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }));
  out.push(prose(sc.description));

  // Indicateurs
  out.push(
    dataTable(
      ["Indicateur", "Baseline", "Après", "Gain"],
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
          "GES (kgCO₂/m²/an)",
          fmt(data.indicateursBaseline.ges, 1),
          fmt(sc.indicateurs.ges, 1),
          `−${fmt(sc.gainGesPct, 1)} %`,
        ],
        ["DPE", data.dpeBaseline, sc.indicateurs.dpe, "—"],
      ],
    ),
  );
  out.push(new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }));

  // Gestes
  if (sc.gestes.length > 0) {
    out.push(
      dataTable(
        ["Geste", "Quantité", "Coût HT"],
        [
          ...sc.gestes.map((g) => [g.nom, String(g.quantite), euro(g.coutHT)]),
          ["Total travaux", "—", euro(sc.coutTotalHT)],
        ],
      ),
    );
    out.push(new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }));
  }

  // Financement
  out.push(
    kvTable([
      { label: "Prime CEE estimée", value: euro(sc.primeCeeEstimee) },
      { label: "MaPrimeRénov'", value: euro(sc.primeMprEstimee) },
      { label: "Autres aides", value: euro(sc.autresAides) },
      { label: "Total des aides", value: euro(sc.aideTotale), highlight: true },
      { label: "Reste à charge", value: euro(sc.resteACharge), highlight: true },
      { label: "Économie annuelle estimée", value: euro(sc.economieAnnuelleEuros) },
      {
        label: "Temps de retour brut",
        value: sc.tempsRetourAns != null ? `${fmt(sc.tempsRetourAns, 1)} ans` : "—",
      },
    ]),
  );
  out.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }));
  return out;
}

export async function generateAuditReglementaireDocx(
  data: AuditReglementaireData,
): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];

  // Cover
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [9600],
      borders: noBorders,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: BRAND_NAVY },
              margins: { top: 200, bottom: 200, left: 360, right: 360 },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({
                      text: "KILOWATER",
                      bold: true,
                      size: 22,
                      color: "FFFFFF",
                      characterSpacing: 80,
                    }),
                    new TextRun({ text: "      ", size: 22 }),
                    new TextRun({
                      text: "BUREAU D'ÉTUDE · RÉNOVATION ÉNERGÉTIQUE",
                      size: 14,
                      color: BRAND_LIGHT,
                      characterSpacing: 60,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );
  children.push(new Paragraph({ spacing: { before: 1800, after: 0 }, children: [] }));
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text: `AUDIT ÉNERGÉTIQUE RÉGLEMENTAIRE · ${data.reference}`,
          bold: true,
          size: 16,
          color: ACCENT,
          characterSpacing: 100,
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: data.siteNom,
          bold: true,
          size: 48,
          color: BRAND_NAVY,
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 300 },
      children: [
        new TextRun({
          text: `${CATEGORIE_LABEL[data.categorie]} — ${REFERENCE_REGLEMENTAIRE[data.categorie]}`,
          italics: true,
          size: 22,
          color: MUTED,
        }),
      ],
    }),
  );
  children.push(
    kvTable([
      { label: "Site", value: `${data.siteNom} — ${data.adresse}, ${data.codePostal} ${data.ville}` },
      { label: "Client / Titulaire", value: data.clientTitulaire },
      { label: "Surface chauffée", value: `${fmt(data.surfaceChauffee)} m²` },
      { label: "Zone climatique", value: data.zoneClimatique },
      { label: "Cep actuel", value: `${fmt(data.cepBaselineKwhEpM2)} kWhEP/m²/an` },
      { label: "Classe DPE", value: `${data.dpeBaseline} — GES ${data.gesClasseBaseline}` },
      { label: "Rédigé par", value: data.auteur },
      { label: "Date d'émission", value: iso(data.dateEmission) },
    ]),
  );

  // Section 1
  children.push(...sectionTitle(1, "Contexte de la mission"));
  children.push(
    prose(
      `La présente mission d'audit énergétique porte sur ${data.siteNom}, ` +
        `${data.adresse}, ${data.codePostal} ${data.ville}, d'une surface chauffée de ` +
        `${fmt(data.surfaceChauffee)} m². Elle est réalisée conformément aux exigences du ` +
        `${REFERENCE_REGLEMENTAIRE[data.categorie]}.`,
    ),
  );
  children.push(
    prose(
      "Objectifs : établir l'état actuel des consommations et des émissions, identifier les " +
        "leviers d'amélioration prioritaires, et proposer trois scénarios de travaux chiffrés " +
        "avec plan de financement et phasage recommandé.",
    ),
  );

  // Section 2
  children.push(...sectionTitle(2, "Présentation du site"));
  children.push(
    kvTable([
      { label: "Adresse", value: `${data.adresse}, ${data.codePostal} ${data.ville}` },
      { label: "Client / Titulaire", value: data.clientTitulaire },
      { label: "Catégorie", value: CATEGORIE_LABEL[data.categorie] },
      { label: "Surface chauffée", value: `${fmt(data.surfaceChauffee)} m²` },
      { label: "Zone climatique", value: data.zoneClimatique },
      {
        label: "Année de construction",
        value: data.anneeConstruction != null ? String(data.anneeConstruction) : "—",
      },
    ]),
  );

  // Section 3
  children.push(...sectionTitle(3, "État actuel — Bilan thermique et énergétique"));
  children.push(
    prose(
      "L'état actuel du bâtiment est établi à partir de la saisie détaillée de l'enveloppe et des " +
        "systèmes énergétiques. Les indicateurs Cep, Cef et GES sont calculés selon la chaîne DPE.",
    ),
  );
  children.push(
    kvTable([
      {
        label: "Consommation Cep",
        value: `${fmt(data.indicateursBaseline.cep)} kWhEP/m²/an`,
      },
      {
        label: "Consommation Cef",
        value: `${fmt(data.indicateursBaseline.cef)} kWhEF/m²/an`,
      },
      {
        label: "Émissions GES",
        value: `${fmt(data.indicateursBaseline.ges, 1)} kgCO₂/m²/an`,
      },
      { label: "Classe DPE", value: data.dpeBaseline },
      { label: "Classe GES", value: data.gesClasseBaseline },
      {
        label: "Besoin chauffage",
        value: `${fmt(data.indicateursBaseline.besoinChauffage)} kWh/m²/an`,
      },
      {
        label: "Besoin ECS",
        value: `${fmt(data.indicateursBaseline.besoinECS)} kWh/m²/an`,
      },
      {
        label: "Coefficient GV",
        value: `${fmt(data.indicateursBaseline.gv, 1)} W/K`,
      },
    ]),
  );

  // Section 4 — 3 scénarios
  children.push(...sectionTitle(4, "Solutions d'amélioration — 3 scénarios obligatoires"));
  children.push(
    prose(
      "Trois scénarios de travaux sont présentés, correspondant à des niveaux de gains croissants. " +
        "Chaque scénario est chiffré (coût, aides, reste à charge, temps de retour).",
    ),
  );
  for (const sc of data.scenarios) {
    children.push(...scenarioBlock(sc, data));
  }

  // Section 5
  children.push(...sectionTitle(5, "Plan de financement — comparaison scénarios"));
  children.push(
    dataTable(
      ["Scénario", "Coût HT", "Prime CEE", "MPR", "Autres", "Reste", "TRI"],
      data.scenarios.map((sc) => [
        `S${sc.code}`,
        euro(sc.coutTotalHT),
        euro(sc.primeCeeEstimee),
        euro(sc.primeMprEstimee),
        euro(sc.autresAides),
        euro(sc.resteACharge),
        sc.tempsRetourAns != null ? `${fmt(sc.tempsRetourAns, 1)} ans` : "—",
      ]),
    ),
  );

  // Section 6
  children.push(...sectionTitle(6, "Phasage et mise en œuvre"));
  children.push(
    prose(
      "Le phasage recommandé dépend du budget et de la stratégie du maître d'ouvrage. Trois logiques :",
    ),
  );
  children.push(
    prose(
      "— Phasage économique : scénario 1 en premier (ROI court), puis capitaliser les économies " +
        "pour financer un geste supplémentaire tous les 3-5 ans.",
    ),
  );
  children.push(
    prose(
      "— Phasage réglementaire : cibler directement le scénario 2 ou 3 pour respecter les échéances " +
        "Décret Tertiaire (−40 % en 2030) ou les objectifs bas carbone.",
    ),
  );
  children.push(
    prose(
      "— Phasage global : opération unique en scénario 3 (rénovation performante BBC) pour maximiser " +
        "la valeur patrimoniale et bénéficier des bonifications sur bouquets.",
    ),
  );

  // Section 7
  children.push(...sectionTitle(7, "Signature"));
  children.push(
    prose(
      `La présente note d'audit engage Kilowater sur l'exactitude méthodologique des calculs, aux ` +
        `conditions décrites. Elle constitue le livrable réglementaire prévu par le ` +
        `${REFERENCE_REGLEMENTAIRE[data.categorie]}.`,
    ),
  );
  children.push(new Paragraph({ spacing: { before: 400, after: 0 }, children: [] }));
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: "____________________________", size: 20, color: MUTED })],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 20 },
      children: [new TextRun({ text: data.auteur, bold: true, size: 22, color: BRAND_NAVY })],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: `Fait le ${iso(data.dateEmission)} — Kilowater · Bureau d'étude en rénovation énergétique`,
          italics: true,
          size: 18,
          color: MUTED,
        }),
      ],
    }),
  );

  const doc = new Document({
    creator: "Kilowater",
    title: `Audit énergétique — ${data.reference}`,
    description: "Audit énergétique réglementaire",
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [
      {
        properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: `KILOWATER  ·  Audit énergétique  ·  ${data.reference}`,
                    size: 16,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Page ", size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
                  new TextRun({ text: " / ", size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}
