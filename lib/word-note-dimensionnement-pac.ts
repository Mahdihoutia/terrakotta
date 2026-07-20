/**
 * Générateur Word (.docx) — Note de dimensionnement PAC air/eau.
 *
 * Pendant du PDF (lib/pdf-note-dimensionnement-pac.ts) : consomme exactement
 * la même NotePacData pour garantir la cohérence des deux formats livrés.
 * Utilisé pour les DO qui exigent un livrable modifiable côté client.
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
import type { NotePacData, CategorieCibleNote } from "./pdf-note-dimensionnement-pac";
import { ficheParCategorie } from "./pdf-note-dimensionnement-pac";

// ─── Palette ────────────────────────────────────────────────────

const ACCENT = "2563EB";
const BRAND_NAVY = "0D1B35";
const BRAND_LIGHT = "60A5FA";
const MUTED = "64748B";
const SURFACE = "F8FAFC";
const SUCCESS_BG = "DCFCE7";

// ─── Libellés ───────────────────────────────────────────────────

const CATEGORIE_LABEL: Record<CategorieCibleNote, string> = {
  TERTIAIRE: "Bâtiment tertiaire existant",
  RESIDENTIEL_COLLECTIF: "Résidentiel collectif (copropriété / bailleur social)",
};

const VECTEUR_LABEL: Record<string, string> = {
  GAZ_NATUREL: "Gaz naturel",
  FIOUL: "Fioul domestique",
  PROPANE: "Propane / GPL",
  ELEC: "Électricité",
  BOIS: "Bois / granulés",
  RESEAU_CHALEUR: "Réseau de chaleur",
};

const REGIME_LABEL: Record<string, string> = {
  BT: "Basse température (plancher chauffant, 30-40°C)",
  MT: "Moyenne température (radiateurs 50-55°C)",
  HT: "Haute température (radiateurs anciens 60-70°C)",
};

const APPOINT_LABEL: Record<string, string> = {
  GAZ: "Chaudière gaz conservée en secours",
  ELEC: "Résistance électrique intégrée",
  AUCUN: "PAC seule sans appoint",
};

// ─── Helpers formatage ──────────────────────────────────────────

function fmtNumber(n: number | undefined, digits = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function pct(n: number | null | undefined, dec = 1): string {
  if (n == null) return "—";
  return `${fmtNumber(n, dec)} %`;
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

// ─── Helpers docx ───────────────────────────────────────────────

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
    children: [
      new TextRun({ text, size: 20, color: BRAND_NAVY }),
    ],
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
            cell(value || "—", { fill: highlight ? SUCCESS_BG : undefined }),
          ],
        }),
    ),
  });
}

function dataTable(headers: string[], rows: string[][], highlightRowIdx?: number): Table {
  const colCount = Math.max(headers.length, 1);
  const total = 9600;
  const widths = Array.from({ length: colCount }, () => Math.round(total / colCount));

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h) =>
      cell(h, {
        bold: true,
        fill: BRAND_NAVY,
        color: "FFFFFF",
        align: AlignmentType.LEFT,
      }),
    ),
  });

  const bodyRows = rows.map(
    (r, idx) =>
      new TableRow({
        cantSplit: true,
        children: r.map((c, colIdx) =>
          cell(c, {
            fill: idx === highlightRowIdx ? SUCCESS_BG : undefined,
            bold: idx === highlightRowIdx,
            align: colIdx === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
          }),
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

// ─── Générateur principal ──────────────────────────────────────

export async function generateNoteDimensionnementPacDocx(
  data: NotePacData,
): Promise<Uint8Array> {
  const fiche = ficheParCategorie(data.categorieCible);
  const children: (Paragraph | Table)[] = [];

  // ─── Cover ────────────────────────────────────────────────
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

  children.push(new Paragraph({ spacing: { before: 2000, after: 0 }, children: [] }));
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text: `NOTE DE DIMENSIONNEMENT PAC · ${data.reference}`,
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
          text: `Substitution ${VECTEUR_LABEL[data.generateurExistantVecteur] ?? data.generateurExistantVecteur} par PAC air/eau`,
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
          text: `Méthode de calibration énergétique par séries temporelles ERA5 Copernicus — ${CATEGORIE_LABEL[data.categorieCible]}`,
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
      { label: "Usage", value: data.usage },
      {
        label: "Générateur existant",
        value: `${data.generateurExistantNb} × ${data.generateurExistantMarque} ${data.generateurExistantModele}`,
      },
      {
        label: "Puissance nominale",
        value: `${fmtNumber(data.generateurExistantPuissanceKw * data.generateurExistantNb)} kW`,
      },
      {
        label: "Période analysée",
        value: `${iso(data.periodeDebut)} → ${iso(data.periodeFin)}`,
      },
      {
        label: "Zone climatique",
        value: `${data.zoneClimatique} (Te_base = ${fmtNumber(data.tBase)}°C)`,
      },
      { label: "Rédigé par", value: data.auteur },
      { label: "Date d'émission", value: iso(data.dateEmission) },
    ]),
  );

  // ─── 1. Synthèse ─────────────────────────────────────────
  children.push(...sectionTitle(1, "Synthèse pour le maître d'ouvrage"));
  children.push(
    prose(
      `La présente étude analyse le surdimensionnement et le remplacement de l'installation de production ` +
        `de chaleur (${data.generateurExistantNb} × ${data.generateurExistantMarque} ${data.generateurExistantModele}, ` +
        `${data.generateurExistantPuissanceKw * data.generateurExistantNb} kW) desservant ${data.siteNom}, ` +
        `en vue d'une valorisation CEE via la fiche ${fiche.code}. Les besoins thermiques ont été recalculés ` +
        `à partir des relevés compteur (code R, ${data.compteurRef}) et des séries temporelles horaires ERA5 ` +
        `Copernicus, calibrées sur la période du ${iso(data.periodeDebut)} au ${iso(data.periodeFin)}.`,
    ),
  );
  children.push(
    kvTable([
      {
        label: "Puissance installée actuelle",
        value: `${fmtNumber(data.generateurExistantPuissanceKw * data.generateurExistantNb)} kW`,
      },
      { label: "Puissance calée (ERA5)", value: `≈ ${fmtNumber(data.pCaleeDh)} kW` },
      {
        label: "Puissance recommandée",
        value: `${data.puissanceRecoMin} – ${data.puissanceRecoMax} kW`,
        highlight: true,
      },
      { label: "Rendement générateur retenu", value: `η ≈ ${fmtNumber(data.rendementExistant, 3)} (PCS)` },
      {
        label: `Énergie ${VECTEUR_LABEL[data.vecteurReleve] ?? data.vecteurReleve} relevée`,
        value: `${fmtNumber(data.totalKwhReleve)} kWh`,
      },
      { label: "ΣDH période (ERA5 horaire)", value: `${fmtNumber(data.sommeDh)} °C·h` },
      {
        label: "Verdict ASHRAE Guideline 14",
        value: data.conformeAshrae ? "✔ Conforme (CV(RMSE) ≤ 15 %, |NMBE| ≤ 5 %)" : "Hors seuils",
        highlight: data.conformeAshrae,
      },
      {
        label: "Réduction CO₂ (scénario retenu)",
        value: `−${fmtNumber(data.scenarioRetenu.reductionCO2Pct, 1)} %`,
        highlight: true,
      },
      ...(data.cee
        ? [{ label: "Prime CEE estimée", value: `${fmtNumber(data.cee.primeEuros)} €`, highlight: true }]
        : []),
    ]),
  );

  // ─── 2. Présentation du site ────────────────────────────
  children.push(...sectionTitle(2, "Présentation du site"));
  children.push(
    kvTable([
      { label: "Adresse", value: `${data.adresse}, ${data.codePostal} ${data.ville}` },
      { label: "Occupant / Client", value: data.clientTitulaire },
      { label: "Usage", value: data.usage },
      { label: "Catégorie réglementaire", value: CATEGORIE_LABEL[data.categorieCible] },
      { label: "Surface chauffée", value: `${fmtNumber(data.surfaceChauffee)} m²` },
      {
        label: "Zone climatique",
        value: `${data.zoneClimatique} (Te_base = ${fmtNumber(data.tBase)}°C, NF EN 12831)`,
      },
      { label: "Fournisseur énergie", value: data.fournisseurEnergie },
      { label: "Compteur / PCE / PDL", value: data.compteurRef },
      { label: "Type de relevé", value: "Compteur communicant (relevés réels R)" },
    ]),
  );

  // ─── 3. Chaufferie existante ────────────────────────────
  children.push(...sectionTitle(3, "Chaufferie / installation existante"));
  children.push(
    prose(
      `La production thermique est assurée par ${data.generateurExistantNb} ` +
        `${data.generateurExistantNb > 1 ? "générateurs" : "générateur"} ` +
        `${data.generateurExistantMarque} ${data.generateurExistantModele} de puissance utile nominale ` +
        `${data.generateurExistantPuissanceKw} kW chacun. Le rendement moyen retenu est de η ≈ ${fmtNumber(data.rendementExistant, 3)} (PCS).`,
    ),
  );
  children.push(
    kvTable([
      { label: "Fabricant", value: data.generateurExistantMarque },
      { label: "Type / Série", value: `${data.generateurExistantMarque} ${data.generateurExistantModele}` },
      { label: "Nombre d'unités", value: String(data.generateurExistantNb) },
      { label: "Puissance nominale unitaire", value: `${fmtNumber(data.generateurExistantPuissanceKw)} kW` },
      {
        label: "Puissance nominale totale",
        value: `${fmtNumber(data.generateurExistantPuissanceKw * data.generateurExistantNb)} kW`,
      },
      {
        label: "Vecteur énergétique",
        value: VECTEUR_LABEL[data.generateurExistantVecteur] ?? data.generateurExistantVecteur,
      },
      { label: "Rendement moyen retenu (PCS)", value: fmtNumber(data.rendementExistant, 3) },
    ]),
  );

  // ─── 4. Données ERA5 ────────────────────────────────────
  children.push(...sectionTitle(4, "Données météorologiques ERA5 Copernicus"));
  children.push(
    prose(
      `La présente étude s'appuie sur les séries temporelles horaires ERA5 (ECMWF / Copernicus C3S), ` +
        `standard international en analyse atmosphérique. Cette approche remplace les DJU annuels moyens ` +
        `dont la résolution temporelle (annuelle) et l'absence de correction d'anomalie interdisent tout ` +
        `calage précis sur consommations mesurées.`,
    ),
  );
  children.push(
    dataTable(
      ["Critère", "DJU annuels (classique)", "Séries horaires ERA5"],
      [
        ["Résolution temporelle", "Annuelle (valeur unique)", `Horaire — ${fmtNumber(data.nbHeuresMeteo)} points`],
        ["Représentativité", "Normale non datée", "Calée sur période réelle"],
        ["Correction anomalie", "Aucune", "Intégrée de facto"],
        ["Calcul degrés-heures", "Approché (DJU × 24)", "Exact (ΣDH heure/heure)"],
        ["Validation sur relevés", "Non possible", "ASHRAE G14"],
      ],
    ),
  );
  children.push(new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }));
  children.push(
    kvTable([
      { label: "Jeu de données", value: "ERA5 — réanalyse horaire ECMWF (C3S)" },
      { label: "Variable", value: "2 m air temperature (t2m)" },
      {
        label: "Coordonnées",
        value: `${fmtNumber(data.latitude, 3)}°N / ${fmtNumber(data.longitude, 3)}°E — ${data.ville}`,
      },
      { label: "Période extraite", value: `${iso(data.periodeDebut)} → ${iso(data.periodeFin)}` },
      { label: "Pas de temps", value: "1 heure" },
      { label: "Nombre de points", value: `${fmtNumber(data.nbHeuresMeteo)} valeurs horaires` },
      { label: "Te_base retenue", value: `${fmtNumber(data.tBase)}°C` },
      { label: "ΣDH calculés", value: `${fmtNumber(data.sommeDh)} °C·h` },
    ]),
  );

  // ─── 5. Consommations relevées ──────────────────────────
  children.push(...sectionTitle(5, "Consommations réelles — Relevés compteur"));
  children.push(
    prose(
      `Les consommations utilisées dans la présente étude sont issues des relevés réels (code R) du compteur ` +
        `${data.compteurRef}. Les valeurs cumulent ${fmtNumber(data.totalKwhReleve)} kWh sur la période.`,
    ),
  );
  const consoRows = [
    ...data.consosMensuelles.map((c) => [c.mois, fmtNumber(c.kwh), String(c.jours)]),
    ["Total", fmtNumber(data.totalKwhReleve), "—"],
  ];
  children.push(
    dataTable(
      ["Mois", `kWh (${VECTEUR_LABEL[data.vecteurReleve] ?? data.vecteurReleve})`, "Jours"],
      consoRows,
      consoRows.length - 1,
    ),
  );

  // ─── 6. Méthode DH ──────────────────────────────────────
  children.push(...sectionTitle(6, "Note de dimensionnement — Méthode degrés-heures"));
  children.push(
    prose(
      `La méthode retenue est la calibration énergétique par séries temporelles horaires (méthode des ` +
        `degrés-heures). Elle simule pour chaque puissance Pmax testée l'énergie thermique horaire, puis la ` +
        `compare à l'énergie relevée en tenant compte du rendement. La température intérieure Ti est modélisée ` +
        `dynamiquement selon les plages horaires réelles d'occupation.`,
    ),
  );
  children.push(
    kvTable([
      { label: "Ti occupation", value: `${fmtNumber(data.tiOccupe)}°C (profil dynamique)` },
      { label: "Ti réduit (nuit / WE)", value: `${fmtNumber(data.tiReduit)}°C` },
      { label: "Te_base", value: `${fmtNumber(data.tBase)}°C (zone ${data.zoneClimatique})` },
      { label: "ΔT_base", value: `${fmtNumber(data.deltaTBase)}°C` },
      { label: "Température d'arrêt", value: `${fmtNumber(data.tArret)}°C` },
      { label: "Rendement η (PCS)", value: fmtNumber(data.rendementExistant, 3) },
      { label: "ΣDH période", value: `${fmtNumber(data.sommeDh)} °C·h` },
      {
        label: `Énergie ${VECTEUR_LABEL[data.vecteurReleve]?.toLowerCase() ?? "combustible"} relevée`,
        value: `${fmtNumber(data.totalKwhReleve)} kWh`,
      },
    ]),
  );

  // ─── 7. Résultats calibration ───────────────────────────
  children.push(...sectionTitle(7, "Résultats de la calibration — Balayage puissance"));
  children.push(
    prose(
      `Balayage des puissances Pmax testées et écart entre énergie calculée par le modèle et énergie ` +
        `relevée. La ligne surlignée correspond à la puissance produisant l'écart le plus faible.`,
    ),
  );
  const scRows = data.scenariosCalibration.map((s) => [
    fmtNumber(s.pmax),
    fmtNumber(s.eUtile),
    fmtNumber(s.eCombust),
    `${s.ecartPct > 0 ? "+" : ""}${fmtNumber(s.ecartPct, 2)} %`,
  ]);
  const bestIdx = data.scenariosCalibration.findIndex((s) => s.pmax === data.pCaleeDh);
  children.push(
    dataTable(
      ["Pmax (kW)", "E utile calc.", "E combust. calc.", "Écart %"],
      scRows,
      bestIdx >= 0 ? bestIdx : undefined,
    ),
  );
  children.push(
    prose(
      `Résultat : Pmax = ${fmtNumber(data.pCaleeDh)} kW produit l'écart le plus petit sur la consommation ` +
        `relevée. C'est la puissance calée du modèle sur l'ensemble de la période analysée.`,
    ),
  );

  // ─── 8. Validation ASHRAE ───────────────────────────────
  children.push(...sectionTitle(8, "Validation statistique — ASHRAE Guideline 14 / IPMVP"));
  children.push(
    prose(
      `Conformément à l'ASHRAE Guideline 14 et au protocole IPMVP, une régression linéaire mensuelle entre ` +
        `les degrés-heures ERA5 et les consommations relevées produit les indices ci-dessous.`,
    ),
  );
  children.push(
    dataTable(
      ["Indice", "Valeur", "Seuil de référence", "Conforme"],
      [
        [
          "R² (coefficient de détermination)",
          data.r2 != null ? fmtNumber(data.r2, 3) : "—",
          "≥ 0,75 recommandé",
          data.r2 != null && data.r2 >= 0.75 ? "OUI" : "—",
        ],
        ["RMSE", data.rmse != null ? `${fmtNumber(data.rmse)} kWh` : "—", "N/A (informatif)", "—"],
        [
          "CV(RMSE)",
          pct(data.cvRmse, 2),
          "≤ 15 %",
          data.cvRmse != null && data.cvRmse <= 15 ? "OUI" : "NON",
        ],
        [
          "NMBE",
          pct(data.nmbe, 2),
          "|NMBE| ≤ 5 %",
          data.nmbe != null && Math.abs(data.nmbe) <= 5 ? "OUI" : "NON",
        ],
        [
          "Verdict global",
          data.conformeAshrae ? "✔ Conforme" : "Hors seuils",
          "CV(RMSE) ≤ 15 % ET |NMBE| ≤ 5 %",
          data.conformeAshrae ? "OUI" : "NON",
        ],
      ],
    ),
  );
  if (data.pCaleeRegression != null) {
    children.push(
      prose(
        `La régression sur points mensuels confirme une puissance calée statistique de ` +
          `${fmtNumber(data.pCaleeRegression, 1)} kW, soit un écart de ${fmtNumber(data.ecartMethodes ?? 0, 2)} % ` +
          `avec l'approche degrés-heures (${fmtNumber(data.pCaleeDh)} kW). Cette convergence des deux méthodes ` +
          `indépendantes atteste la robustesse du dimensionnement.`,
      ),
    );
  }

  // ─── 9. Recommandation dimensionnement ──────────────────
  children.push(...sectionTitle(9, "Recommandation de redimensionnement"));
  children.push(
    prose(
      `La puissance calée en régime établi ne couvre pas les phénomènes transitoires (relance, pertes réseau, ` +
        `grand froid) : des marges d'ingénierie sont ajoutées pour définir la puissance recommandée.`,
    ),
  );
  const surdimPct = fmtNumber(
    (1 -
      data.puissanceRecoMax /
        (data.generateurExistantPuissanceKw * data.generateurExistantNb)) *
      100,
    0,
  );
  children.push(
    kvTable([
      { label: "Puissance calée (régime établi)", value: `${fmtNumber(data.pCaleeDh)} kW` },
      {
        label: "Marge remise en chauffe",
        value: `+${pct(data.margeRelance * 100, 0)} — locaux inoccupés la nuit`,
      },
      {
        label: "Marge pertes distribution",
        value: `+${pct(data.margeDistribution * 100, 0)}`,
      },
      { label: "Marge grand froid", value: `Intégrée via Te_base = ${fmtNumber(data.tBase)}°C` },
      {
        label: "Puissance recommandée",
        value: `${data.puissanceRecoMin} – ${data.puissanceRecoMax} kW`,
        highlight: true,
      },
      {
        label: "Fourchette commerciale standard",
        value:
          data.fourchetteCommerciale.length > 0
            ? data.fourchetteCommerciale.map((p) => `${p} kW`).join(" / ")
            : "Configuration cascade requise",
      },
      {
        label: "Surdimensionnement actuel",
        value: `${data.generateurExistantPuissanceKw * data.generateurExistantNb} kW → ${data.puissanceRecoMin}–${data.puissanceRecoMax} kW ≈ −${surdimPct} %`,
      },
    ]),
  );

  // ─── 10. Scénario PAC retenu ────────────────────────────
  children.push(...sectionTitle(10, "Scénario PAC retenu — Simulation horaire"));
  const s = data.scenarioRetenu;
  children.push(
    prose(
      `Scénario "${s.nom}" : ${s.unites.length > 1 ? "cascade de " + s.unites.length + " unités" : "1 unité"} ` +
        `(${s.unites.join(" + ")} kW, total ${s.puissanceInstallee} kW), régime ${s.regime} ` +
        `(${REGIME_LABEL[s.regime] ?? s.regime}), appoint = ${APPOINT_LABEL[s.typeAppoint]?.toLowerCase() ?? s.typeAppoint}.`,
    ),
  );
  const scenarioRows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Puissance PAC installée", value: `${s.puissanceInstallee} kW`, highlight: true },
    {
      label: "Configuration des unités",
      value: s.unites.length > 1 ? `Cascade ${s.unites.join(" + ")} kW` : `Mono-bloc ${s.unites[0]} kW`,
    },
    { label: "Régime émetteurs", value: REGIME_LABEL[s.regime] ?? s.regime },
    { label: "Type d'appoint", value: APPOINT_LABEL[s.typeAppoint] ?? s.typeAppoint },
    {
      label: "Température de bivalence calculée",
      value:
        s.temperatureBivalence != null
          ? `${fmtNumber(s.temperatureBivalence, 1)}°C`
          : "PAC seule sur toute la plage",
    },
    {
      label: "Taux de couverture PAC",
      value: `${pct(s.tauxCouverturePAC * 100, 1)} du besoin thermique`,
      highlight: true,
    },
    {
      label: "SCOP saisonnier estimé",
      value: `${fmtNumber(s.scop, 2)} (pondéré par énergie utile)`,
      highlight: true,
    },
    { label: "Consommation électrique PAC", value: `${fmtNumber(s.consoElecPAC)} kWh élec` },
  ];
  if (s.typeAppoint === "GAZ") {
    scenarioRows.push({ label: "Consommation gaz d'appoint", value: `${fmtNumber(s.consoAppointGaz)} kWh PCS` });
  } else if (s.typeAppoint === "ELEC") {
    scenarioRows.push({ label: "Consommation appoint électrique", value: `${fmtNumber(s.consoAppointElec)} kWh élec` });
  }
  children.push(kvTable(scenarioRows));

  // ─── 11. Cadre CEE ──────────────────────────────────────
  children.push(...sectionTitle(11, "Cadre réglementaire CEE"));
  children.push(
    prose(
      `Cette opération est éligible à la fiche CEE ${fiche.code} — ${fiche.libelle}. La présente note de ` +
        `dimensionnement est une pièce obligatoire remise au bénéficiaire à l'achèvement de l'opération pour ` +
        `sécuriser l'obtention de la prime CEE.`,
    ),
  );
  const ceeRows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Code fiche CEE", value: fiche.code },
    { label: "Libellé fiche", value: fiche.libelle },
    { label: "Catégorie du bâtiment", value: CATEGORIE_LABEL[data.categorieCible] },
    { label: "Surface chauffée", value: `${fmtNumber(data.surfaceChauffee)} m²` },
  ];
  if (data.cee) {
    ceeRows.push(
      { label: "Forfait kWhc/m² (×0.8 secteur)", value: `${fmtNumber(data.cee.forfaitKwhcParM2)} kWhc/m²` },
      { label: "Facteur correctif secteur", value: fmtNumber(data.cee.facteurCorrectifSecteur, 2) },
      {
        label: "Facteur R",
        value: `${fmtNumber(data.cee.facteurR, 2)} (${data.cee.facteurR === 1 ? "chaudière en secours inactif" : "config partielle"})`,
      },
      { label: "Bonification Coup de Pouce", value: `×${fmtNumber(data.cee.bonificationCoupDePouce)}` },
      { label: "Volume CEE brut", value: `${fmtNumber(data.cee.volumeKwhc)} kWhc` },
      { label: "Volume CEE bonifié", value: `${fmtNumber(data.cee.volumeBonifiKwhc)} kWhc`, highlight: true },
      { label: "Prix moyen kWhc", value: `${fmtNumber(data.cee.primeEurMWhc, 2)} €/MWhc` },
      { label: "Prime CEE estimée", value: `${fmtNumber(data.cee.primeEuros)} €`, highlight: true },
    );
  }
  ceeRows.push(
    { label: "Durée de vie conventionnelle", value: `${fmtNumber(data.cee?.dureeVieAnnees ?? 22)} ans` },
    { label: "Date limite d'engagement", value: data.cee?.dateLimiteEngagement ?? "31 décembre 2030" },
  );
  children.push(kvTable(ceeRows));

  // ─── 12. Bilan carbone ──────────────────────────────────
  children.push(...sectionTitle(12, "Bilan carbone Avant / Après"));
  children.push(
    prose(
      `Facteurs d'émission ADEME retenus (Base Empreinte 2024, méthode ACV) : ` +
        `${VECTEUR_LABEL[data.generateurExistantVecteur]?.toLowerCase() ?? "combustible"} 0,227 kgCO₂/kWh PCI ` +
        `pondéré par le rendement chaudière, et électricité 0,055 kgCO₂/kWh (mix France).`,
    ),
  );
  children.push(
    dataTable(
      ["Situation", "Énergie consommée (période)", "Émissions CO₂"],
      [
        [
          `Avant — 100 % ${VECTEUR_LABEL[data.generateurExistantVecteur] ?? data.generateurExistantVecteur}`,
          `${fmtNumber(data.totalKwhReleve)} kWh`,
          `${fmtNumber(s.emissionsCO2AvantKg / 1000, 2)} tCO₂`,
        ],
        [
          `Après — ${s.nom}`,
          `${fmtNumber(s.consoElecPAC)} kWh élec` +
            (s.consoAppointGaz > 0 ? ` + ${fmtNumber(s.consoAppointGaz)} kWh gaz` : "") +
            (s.consoAppointElec > 0 ? ` + ${fmtNumber(s.consoAppointElec)} kWh élec appoint` : ""),
          `${fmtNumber(s.emissionsCO2ApresKg / 1000, 2)} tCO₂`,
        ],
        [
          "Réduction",
          "—",
          `−${fmtNumber(s.reductionCO2Pct, 1)} % (−${fmtNumber((s.emissionsCO2AvantKg - s.emissionsCO2ApresKg) / 1000, 2)} tCO₂)`,
        ],
      ],
    ),
  );

  // ─── 13. Signature ──────────────────────────────────────
  children.push(...sectionTitle(13, "Signature"));
  children.push(
    prose(
      `La présente note engage Kilowater sur l'exactitude méthodologique du calage réalisé, aux conditions ` +
        `décrites (période, coordonnées ERA5, profils d'occupation, rendement retenu). Elle constitue la pièce ` +
        `technique demandée par la fiche ${fiche.code} pour la valorisation CEE de l'opération.`,
    ),
  );
  children.push(new Paragraph({ spacing: { before: 400, after: 0 }, children: [] }));
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({ text: "____________________________", size: 20, color: MUTED }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 20 },
      children: [
        new TextRun({ text: data.auteur, bold: true, size: 22, color: BRAND_NAVY }),
      ],
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

  // ─── Doc ──────────────────────────────────────────────
  const doc = new Document({
    creator: "Kilowater",
    title: `Note de dimensionnement PAC — ${data.reference}`,
    description: "Note de dimensionnement CEE — PAC air/eau",
    styles: {
      default: {
        document: { run: { font: "Calibri" } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: `KILOWATER  ·  Note de dimensionnement PAC  ·  ${data.reference}`,
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
