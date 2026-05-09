/**
 * Générateur Word (.docx) — Rapport d'audit projet (Kilowater).
 *
 * Pendant côté serveur du PDF — consomme la même `RapportProjetData` que
 * `lib/pdf-rapport-projet.ts` pour garantir la cohérence des chiffres
 * livrés au client. Pas de canvas / Image / DOM — utilisable depuis un
 * Route Handler Next.js.
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
  PageBreak,
  ShadingType,
  TableLayoutType,
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
} from "docx";

import type { RapportProjetData } from "./pdf-rapport-projet";

const ACCENT = "2563EB";
const BRAND_NAVY = "0D1B35";
const BRAND_LIGHT = "60A5FA";
const BRAND_NAME = "KILOWATER";
const BRAND_TAGLINE = "Rénover l'existant, construire l'avenir.";

const TYPE_SYS_LABEL: Record<string, string> = {
  CHAUFFAGE: "Chauffage",
  ECS: "ECS",
  VENTILATION: "Ventilation",
  CLIMATISATION: "Climatisation",
};
const VECTEUR_LABEL: Record<string, string> = {
  ELEC: "Électricité",
  GAZ_NATUREL: "Gaz naturel",
  FIOUL: "Fioul",
  BOIS: "Bois",
  PROPANE: "Propane",
  RESEAU_CHALEUR: "Réseau chaleur",
};

function fmtNumber(n: number, frac = 0): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  });
}
function fmtEuro(n: number): string {
  return `${fmtNumber(Math.round(n))} €`;
}
function fmtPct(n: number): string {
  return `${fmtNumber(n, 1)} %`;
}

const thin = { style: BorderStyle.SINGLE, size: 4, color: "D6D3D1" };
const tableBorders = {
  top: thin, bottom: thin, left: thin, right: thin,
  insideHorizontal: thin, insideVertical: thin,
};
const noneBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = {
  top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder,
  insideHorizontal: noneBorder, insideVertical: noneBorder,
};

function cell(
  text: string,
  opts: {
    bold?: boolean;
    fill?: string;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    size?: number;
    width?: number;
  } = {},
): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
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

function kvTable(rows: { label: string; value: string }[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
    columnWidths: [3840, 5760],
    rows: rows.map(
      ({ label, value }) =>
        new TableRow({
          cantSplit: true,
          children: [
            cell(label, { bold: true, fill: "F8FAFC", color: "475569" }),
            cell(value || "—"),
          ],
        }),
    ),
  });
}

function dataTable(headers: string[], rows: string[][]): Table {
  const colCount = Math.max(headers.length, 1);
  const total = 9600;
  const widths: number[] = colCount >= 3
    ? [
        Math.round(total * 0.4),
        ...Array.from({ length: colCount - 1 }, () =>
          Math.round((total * 0.6) / (colCount - 1)),
        ),
      ]
    : Array.from({ length: colCount }, () => Math.round(total / colCount));

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map(
      (h, idx) =>
        new TableCell({
          width: { size: widths[idx], type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "E7E5E4" },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: idx === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: h, bold: true, size: 18 })],
            }),
          ],
        }),
    ),
  });
  const dataRows = rows.map(
    (r) =>
      new TableRow({
        cantSplit: true,
        children: Array.from({ length: colCount }, (_, idx) => {
          return new TableCell({
            width: { size: widths[idx], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: idx === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: r[idx] ?? "", size: 18 })],
              }),
            ],
          });
        }),
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
    columnWidths: widths,
    rows: [headerRow, ...dataRows],
  });
}

export async function generateRapportProjetDocx(
  data: RapportProjetData,
): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];

  const clientName = [data.projet.client.nom, data.projet.client.prenom]
    .filter(Boolean)
    .join(" ");

  /* ─── Couverture (bandeau marque) ──────────────────────────── */
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
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 200, bottom: 200, left: 360, right: 360 },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({
                      text: BRAND_NAME,
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

  children.push(new Paragraph({ spacing: { before: 2400, after: 0 }, children: [] }));
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text: `RAPPORT D'AUDIT ÉNERGÉTIQUE   ·   ${data.projet.reference.toUpperCase()}`,
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
          text: data.projet.titre,
          bold: true,
          size: 64,
          color: BRAND_NAVY,
        }),
      ],
    }),
  );
  if (clientName) {
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `Bénéficiaire : ${clientName}`,
            italics: true,
            size: 24,
            color: "64748B",
          }),
        ],
      }),
    );
  }

  // Méta couverture
  const dateAudit = new Date(data.projet.dateAudit).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const metaRows = [
    { label: "Référence", value: data.projet.reference },
    { label: "Date d'édition", value: dateAudit },
    { label: "Adresse chantier", value: data.projet.adresseChantier ?? "—" },
    { label: "Type de travaux", value: data.projet.typeTravaux ?? "—" },
    { label: "Surface habitable", value: `${fmtNumber(data.surface, 1)} m²` },
    { label: "Volume chauffé", value: `${fmtNumber(data.volume, 0)} m³` },
  ];
  children.push(
    new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),
  );
  children.push(kvTable(metaRows));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  /* ─── Synthèse DPE ─────────────────────────────────────────── */
  if (data.dpe) {
    children.push(...sectionTitle(1, "Synthèse énergétique (DPE)"));
    children.push(
      kvTable([
        { label: "Étiquette énergie (Cep)", value: `${data.dpe.classe_dpe} · ${fmtNumber(data.dpe.cep, 0)} kWh EP/m²·an` },
        { label: "Étiquette climat (GES)", value: `${data.dpe.classe_ges} · ${fmtNumber(data.dpe.ges, 1)} kg CO₂e/m²·an` },
        { label: "Classe finale", value: data.dpe.classe_finale },
      ]),
    );
    children.push(
      new Paragraph({ spacing: { before: 160, after: 80 }, children: [
        new TextRun({ text: "Détail par usage", bold: true, size: 20, color: BRAND_NAVY }),
      ]}),
    );
    children.push(
      dataTable(
        ["Usage", "Vecteur", "EF (kWh/an)", "EP (kWh/an)", "CO₂ (kg/an)"],
        data.dpe.detail.map((d) => [
          d.usage,
          VECTEUR_LABEL[d.vecteur.toUpperCase()] ?? d.vecteur,
          fmtNumber(d.ef_kwh, 0),
          fmtNumber(d.ep_kwh, 0),
          fmtNumber(d.co2_kg, 0),
        ]),
      ),
    );
  }

  /* ─── Bilan thermique ──────────────────────────────────────── */
  children.push(...sectionTitle(2, "Bilan thermique de l'enveloppe"));
  if (data.surface <= 0) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 200 },
        shading: { type: ShadingType.CLEAR, color: "auto", fill: "FEF3C7" },
        children: [
          new TextRun({
            text: "⚠ Saisie incomplète — la surface habitable est nulle. Les ratios par m² ne sont pas calculés ; complète l'onglet Bâti pour obtenir un livrable exploitable.",
            size: 20,
            color: "92400E",
          }),
        ],
      }),
    );
  }
  children.push(
    kvTable([
      { label: "Coefficient GV", value: `${fmtNumber(data.bilan.gv, 0)} W/K` },
      { label: "Ubat moyen", value: `${fmtNumber(data.bilan.ubat, 2)} W/m²·K` },
      { label: "Pertes à T° de base", value: `${fmtNumber(data.bilan.pertesTBase, 0)} W` },
      {
        label: "Besoin de chauffage net",
        value: data.surface > 0
          ? `${fmtNumber(data.bilan.besoinChauffage, 0)} kWh/an  ·  ${fmtNumber(data.bilan.besoinChauffage / data.surface, 0)} kWh/m²·an`
          : "—",
      },
    ]),
  );
  children.push(
    new Paragraph({ spacing: { before: 160, after: 80 }, children: [
      new TextRun({ text: "Répartition des déperditions", bold: true, size: 20, color: BRAND_NAVY }),
    ]}),
  );
  children.push(
    dataTable(
      ["Poste", "Part"],
      [
        ["Murs", fmtPct(data.bilan.pctMurs)],
        ["Toiture", fmtPct(data.bilan.pctToiture)],
        ["Plancher bas", fmtPct(data.bilan.pctPlancher)],
        ["Vitrages", fmtPct(data.bilan.pctVitree)],
        ["Ponts thermiques", fmtPct(data.bilan.pctPontsThermiques)],
        ["Ventilation", fmtPct(data.bilan.pctVentilation)],
        ["Infiltrations", fmtPct(data.bilan.pctInfiltrations)],
      ],
    ),
  );
  children.push(
    new Paragraph({ spacing: { before: 160, after: 80 }, children: [
      new TextRun({ text: "Surfaces et coefficients U", bold: true, size: 20, color: BRAND_NAVY }),
    ]}),
  );
  children.push(
    dataTable(
      ["Paroi", "Surface (m²)", "U (W/m²·K)"],
      [
        ["Murs", fmtNumber(data.bilan.surfaceMurs, 1), fmtNumber(data.bilan.uMurs, 2)],
        ["Toiture", fmtNumber(data.bilan.surfaceToiture, 1), fmtNumber(data.bilan.uToiture, 2)],
        ["Plancher", fmtNumber(data.bilan.surfacePlancher, 1), fmtNumber(data.bilan.uPlancher, 2)],
        ["Vitrages", fmtNumber(data.bilan.surfaceVitree, 1), fmtNumber(data.bilan.uVitree, 2)],
      ],
    ),
  );

  /* ─── Bâtiments ────────────────────────────────────────────── */
  if (data.batiments.length > 0) {
    children.push(...sectionTitle(3, "Description des bâtiments"));
    children.push(
      dataTable(
        ["Bâtiment", "Zone climatique", "Surface (m²)", "Zones", "Parois"],
        data.batiments.map((b) => [
          b.nom,
          b.zoneClimatique ?? "—",
          fmtNumber(b.surface, 1),
          String(b.nbZones),
          String(b.nbParois),
        ]),
      ),
    );
  }

  /* ─── Systèmes ─────────────────────────────────────────────── */
  if (data.systemes.length > 0) {
    children.push(...sectionTitle(4, "Systèmes énergétiques"));
    children.push(
      dataTable(
        ["Type", "Vecteur", "Nom", "Rendement / SCOP", "Couverture"],
        data.systemes.map((s) => [
          TYPE_SYS_LABEL[s.type] ?? s.type,
          VECTEUR_LABEL[s.vecteur] ?? s.vecteur,
          s.nom,
          fmtNumber(s.rendement, 2),
          fmtPct(s.partCouverture * 100),
        ]),
      ),
    );
  }

  /* ─── Apports solaires ─────────────────────────────────────── */
  if (data.apportsSolaires) {
    children.push(...sectionTitle(5, "Apports solaires gratuits"));
    children.push(
      kvTable([
        { label: "Surface vitrée totale", value: `${fmtNumber(data.apportsSolaires.surfaceVitreeTotale, 1)} m²` },
        { label: "Apport annuel", value: `${fmtNumber(data.apportsSolaires.apportAnnuel, 0)} kWh/an` },
        { label: "Saison de chauffe", value: `${fmtNumber(data.apportsSolaires.apportSaisonChauffe, 0)} kWh` },
        { label: "Saison chaude", value: `${fmtNumber(data.apportsSolaires.apportSaisonChaude, 0)} kWh` },
        { label: "Risque de surchauffe", value: data.apportsSolaires.risqueSurchauffe ? "Oui — protections solaires recommandées" : "Non" },
      ]),
    );
    if (data.apportsSolaires.detailParOrientation.length > 0) {
      children.push(
        new Paragraph({ spacing: { before: 160, after: 80 }, children: [
          new TextRun({ text: "Détail par orientation", bold: true, size: 20, color: BRAND_NAVY }),
        ]}),
      );
      children.push(
        dataTable(
          ["Orientation", "Apport (kWh/an)"],
          data.apportsSolaires.detailParOrientation.map((d) => [
            d.orientation,
            fmtNumber(d.apport, 0),
          ]),
        ),
      );
    }
  }

  /* ─── Plan de financement (aides) ──────────────────────────── */
  if (data.aides) {
    children.push(...sectionTitle(6, "Plan de financement"));
    children.push(
      kvTable([
        { label: "Coût des travaux TTC", value: fmtEuro(data.aides.coutTravauxTTC) },
        { label: "Total des aides", value: fmtEuro(data.aides.totalAides) },
        { label: "Reste à charge", value: fmtEuro(data.aides.resteACharge) },
        { label: "Eco-PTZ mobilisable", value: fmtEuro(data.aides.ecoPtzMax) },
      ]),
    );
    if (data.aides.lignes.length > 0) {
      children.push(
        new Paragraph({ spacing: { before: 160, after: 80 }, children: [
          new TextRun({ text: "Détail des aides mobilisables", bold: true, size: 20, color: BRAND_NAVY }),
        ]}),
      );
      children.push(
        dataTable(
          ["Aide", "Base de calcul", "Montant"],
          data.aides.lignes.map((l) => [l.libelle, l.base, fmtEuro(l.montant)]),
        ),
      );
    }
  }

  /* ─── Calibration ──────────────────────────────────────────── */
  if (data.calibration) {
    children.push(...sectionTitle(7, "Calibration sur facture"));
    children.push(
      kvTable([
        { label: "Conso facture chauffage", value: `${fmtNumber(data.calibration.consoFacture, 0)} kWh/an` },
        { label: "Conso calculée brute", value: `${fmtNumber(data.calibration.consoCalculee, 0)} kWh/an` },
        { label: "Facteur de calibration", value: fmtNumber(data.calibration.factor, 2) },
      ]),
    );
  }

  /* ─── Ponts thermiques ─────────────────────────────────────── */
  if (data.pontsThermiques) {
    children.push(...sectionTitle(8, "Ponts thermiques"));
    children.push(
      kvTable([
        { label: "Type d'isolation détecté", value: data.pontsThermiques.isolation },
        { label: "Coefficient H_PT", value: `${fmtNumber(data.pontsThermiques.hTotal, 1)} W/K` },
        {
          label: "Méthode",
          value: data.pontsThermiques.methode === "DETAIL"
            ? "Saisie détaillée (psi × longueur)"
            : "Forfaitaire (% des parois opaques)",
        },
      ]),
    );
  }

  /* ─── Document ─────────────────────────────────────────────── */
  const doc = new Document({
    creator: BRAND_NAME,
    title: `Rapport d'audit — ${data.projet.titre}`,
    description: `Référence ${data.projet.reference}`,
    styles: {
      default: { document: { run: { font: "Calibri", size: 20 } } },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: `Rapport d'audit  ·  ${data.projet.reference}`,
                    size: 16,
                    color: BRAND_NAVY,
                    bold: true,
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
                spacing: { before: 0, after: 80 },
                border: {
                  bottom: { color: ACCENT, size: 6, style: BorderStyle.SINGLE, space: 1 },
                },
                children: [],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: BRAND_NAME,
                    bold: true,
                    size: 14,
                    color: BRAND_NAVY,
                    characterSpacing: 40,
                  }),
                  new TextRun({ text: "  ·  ", size: 14, color: "CBD5E1" }),
                  new TextRun({
                    text: BRAND_TAGLINE,
                    italics: true,
                    size: 14,
                    color: "64748B",
                  }),
                  new TextRun({ text: "                                                            ", size: 14 }),
                  new TextRun({ text: "Page ", size: 14, color: "94A3B8" }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 14,
                    bold: true,
                    color: ACCENT,
                  }),
                  new TextRun({ text: " / ", size: 14, color: "94A3B8" }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 14,
                    color: "94A3B8",
                  }),
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
