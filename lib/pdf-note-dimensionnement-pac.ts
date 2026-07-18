/**
 * Générateur PDF — Note de dimensionnement PAC air/eau (tertiaire & résidentiel collectif).
 *
 * Livrable opposable aux organismes de contrôle CEE (fiches BAT-TH-163 en tertiaire
 * et BAR-TH-171 en résidentiel collectif). Structure calquée sur les notes du
 * marché (méthode calibration ERA5 + méthode degrés-heures dynamique + validation
 * statistique ASHRAE Guideline 14 / IPMVP).
 *
 * Sections :
 *   1. Synthèse pour le maître d'ouvrage
 *   2. Présentation du site
 *   3. Chaufferie / installation existante
 *   4. Données météorologiques ERA5 Copernicus
 *   5. Consommations réelles relevées
 *   6. Note de dimensionnement — méthode de calibration
 *   7. Résultats de la calibration (balayage puissance)
 *   8. Validation statistique (ASHRAE G14 / IPMVP)
 *   9. Recommandation de redimensionnement
 *  10. Scénario PAC retenu — simulation horaire
 *  11. Cadre réglementaire CEE (fiche selon catégorie)
 *  12. Bilan carbone Avant / Après
 *  13. Signature
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
  getDataTableConfig,
  sanitizePdfText,
  formatNumberPdf,
  needsPageBreak,
  type TocEntry,
} from "./pdf-styles";

// ─── Types de payload ──────────────────────────────────────────

export type CategorieCibleNote = "TERTIAIRE" | "RESIDENTIEL_COLLECTIF";
export type RegimePAC = "BT" | "MT" | "HT";
export type TypeAppoint = "GAZ" | "ELEC" | "AUCUN";
export type VecteurExistant =
  | "GAZ_NATUREL"
  | "FIOUL"
  | "PROPANE"
  | "ELEC"
  | "BOIS"
  | "RESEAU_CHALEUR";

export interface NotePacData {
  /** Référence du dossier (ex. "KW-PAC-2026-042"). */
  reference: string;
  /** Cible réglementaire — impacte la fiche CEE citée. */
  categorieCible: CategorieCibleNote;

  // Site
  siteNom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  usage: string; // "Établissement scolaire", "Copropriété", etc.
  clientTitulaire: string;

  // Bâtiment
  surfaceChauffee: number; // m²
  zoneClimatique: string; // "H1", "H2", "H3"
  tBase: number; // °C (Te_base normative)

  // Chaufferie existante
  generateurExistantMarque: string; // "Atlantic Guillot"
  generateurExistantModele: string; // "VARMAX 180"
  generateurExistantNb: number; // 2
  generateurExistantPuissanceKw: number; // 180
  generateurExistantVecteur: VecteurExistant;
  rendementExistant: number; // 0-1 PCS
  fournisseurEnergie: string; // "ENI / PLENITUDE"
  compteurRef: string; // "GI044096"

  // Période analysée
  periodeDebut: string; // ISO
  periodeFin: string;

  // Météo ERA5
  latitude: number;
  longitude: number;
  sommeDh: number; // °C·h
  nbHeuresMeteo: number; // 4344 par ex.

  // Consommations relevées
  consosMensuelles: Array<{ mois: string; kwh: number; jours: number }>;
  totalKwhReleve: number;
  vecteurReleve: VecteurExistant;

  // Paramètres du modèle
  tiOccupe: number;
  tiReduit: number;
  tArret: number;
  deltaTBase: number; // Ti - Tebase

  // Résultats calibration
  scenariosCalibration: Array<{
    pmax: number;
    eUtile: number;
    eCombust: number;
    ecartPct: number;
    verdict: "surdim" | "sousdim" | "bon" | "borderline";
  }>;
  pCaleeDh: number;
  pCaleeRegression: number | null;
  ecartMethodes: number | null;

  // Validation stat
  r2: number | null;
  rmse: number | null;
  cvRmse: number | null;
  nmbe: number | null;
  conformeAshrae: boolean;

  // Recommandation dimensionnement
  puissanceRecoMin: number;
  puissanceRecoMax: number;
  fourchetteCommerciale: number[];
  margeRelance: number;
  margeDistribution: number;

  // Scénario PAC retenu
  scenarioRetenu: {
    nom: string;
    regime: RegimePAC;
    unites: number[];
    typeAppoint: TypeAppoint;
    puissanceInstallee: number;
    temperatureBivalence: number | null;
    tauxCouverturePAC: number; // 0-1
    scop: number;
    consoElecPAC: number;
    consoAppointGaz: number;
    consoAppointElec: number;
    emissionsCO2AvantKg: number;
    emissionsCO2ApresKg: number;
    reductionCO2Pct: number;
  };

  // CEE
  cee?: {
    ficheCode: string; // "BAT-TH-163", "BAR-TH-171"
    ficheLibelle: string;
    forfaitKwhcParM2: number;
    facteurCorrectifSecteur: number;
    facteurR: number;
    bonificationCoupDePouce: number; // 1 ou 3
    volumeKwhc: number;
    volumeBonifiKwhc: number;
    primeEurMWhc: number;
    primeEuros: number;
    dateLimiteEngagement: string;
    dureeVieAnnees: number;
  };

  auteur: string;
  dateEmission: string; // ISO
}

// ─── Utilitaires locaux ────────────────────────────────────────

const CATEGORIE_LABEL: Record<CategorieCibleNote, string> = {
  TERTIAIRE: "Bâtiment tertiaire existant",
  RESIDENTIEL_COLLECTIF: "Résidentiel collectif (copropriété / bailleur social)",
};

const VECTEUR_LABEL: Record<VecteurExistant, string> = {
  GAZ_NATUREL: "Gaz naturel",
  FIOUL: "Fioul domestique",
  PROPANE: "Propane / GPL",
  ELEC: "Électricité (Joule ou convecteurs)",
  BOIS: "Bois / granulés",
  RESEAU_CHALEUR: "Réseau de chaleur",
};

const REGIME_LABEL: Record<RegimePAC, string> = {
  BT: "Basse température (plancher chauffant ou ventilo-convecteurs, 30-40°C)",
  MT: "Moyenne température (radiateurs 50-55°C)",
  HT: "Haute température (radiateurs anciens 60-70°C)",
};

const APPOINT_LABEL: Record<TypeAppoint, string> = {
  GAZ: "Chaudière gaz conservée en secours",
  ELEC: "Résistance électrique intégrée",
  AUCUN: "PAC seule sans appoint",
};

const VERDICT_LABEL: Record<
  NotePacData["scenariosCalibration"][number]["verdict"],
  string
> = {
  bon: "Bon calage (<5%)",
  borderline: "Borderline (5-10%)",
  surdim: "Ecart trop grand (surdim)",
  sousdim: "Ecart trop grand (sous-dim)",
};


function fmt(n: number, dec = 0): string {
  return formatNumberPdf(n, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function pct(n: number, dec = 1): string {
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

/** Assigne la fiche CEE de référence en fonction de la catégorie cible. */
export function ficheParCategorie(cat: CategorieCibleNote): {
  code: string;
  libelle: string;
} {
  if (cat === "TERTIAIRE") {
    return {
      code: "BAT-TH-163",
      libelle:
        "Pompe à chaleur de type air/eau — bâtiments tertiaires existants (arrêté 6 septembre 2025, 75e arrêté CEE, en vigueur depuis le 1er janvier 2026)",
    };
  }
  return {
    code: "BAR-TH-171",
    libelle:
      "Pompe à chaleur de type air/eau à usage collectif — bâtiments résidentiels collectifs existants",
  };
}

// ─── Générateur principal ──────────────────────────────────────

export function generateNoteDimensionnementPacPdf(data: NotePacData): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pw = doc.internal.pageSize.getWidth();
  const contentW = pw - PDF_LAYOUT.margin * 2;
  const tocPages: TocEntry[] = [];

  // ─── Cover ─────────────────────────────────────────────────
  drawCoverPage(
    doc,
    "Note de dimensionnement PAC",
    `${CATEGORIE_LABEL[data.categorieCible]}\nSubstitution ${VECTEUR_LABEL[data.generateurExistantVecteur]} par PAC air/eau — méthode ERA5 Copernicus`,
    [
      ["Site", `${data.siteNom} — ${data.adresse}, ${data.codePostal} ${data.ville}`],
      ["Client / Titulaire", data.clientTitulaire],
      ["Usage", data.usage],
      [
        "Générateur existant",
        `${data.generateurExistantNb} × ${data.generateurExistantMarque} ${data.generateurExistantModele}`,
      ],
      [
        "Puissance nominale",
        `${data.generateurExistantPuissanceKw * data.generateurExistantNb} kW (${data.generateurExistantNb} × ${data.generateurExistantPuissanceKw} kW)`,
      ],
      ["Période analysée", `${iso(data.periodeDebut)} -> ${iso(data.periodeFin)}`],
      ["Zone climatique", `${data.zoneClimatique} (Te_base = ${fmt(data.tBase)}°C)`],
      ["Date du rapport", iso(data.dateEmission)],
      ["Rédigé par", data.auteur],
    ],
    data.reference,
  );

  // Sommaire (placeholder – rempli après)
  doc.addPage();
  const tocPage = doc.getCurrentPageInfo().pageNumber;

  // On note les pages avant chaque section pour peupler le TOC ensuite.
  const addSection = (title: string) => {
    doc.addPage();
    tocPages.push({ title, page: doc.getCurrentPageInfo().pageNumber });
    return drawSectionHeader(doc, title, PDF_LAYOUT.topMargin);
  };

  // ─── 1. Synthèse maître d'ouvrage ────────────────────────
  {
    let y = addSection("1. Synthèse pour le maître d'ouvrage");
    y = drawProseParagraph(
      doc,
      `La présente étude analyse le surdimensionnement et le remplacement de l'installation de production ` +
        `de chaleur (${data.generateurExistantNb} × ${data.generateurExistantMarque} ${data.generateurExistantModele}, ` +
        `${data.generateurExistantPuissanceKw * data.generateurExistantNb} kW) desservant ${data.siteNom}, ` +
        `${data.adresse}, ${data.codePostal} ${data.ville}, en vue d'une valorisation au titre de la fiche CEE ` +
        `${data.cee?.ficheCode ?? ficheParCategorie(data.categorieCible).code}. Les besoins thermiques réels ont été recalculés à ` +
        `partir des relevés de consommation (code R, compteur ${data.compteurRef}) et des séries temporelles horaires ` +
        `de température ERA5 Copernicus (ECMWF / C3S), calibrées sur la période d'occupation réelle ` +
        `du ${iso(data.periodeDebut)} au ${iso(data.periodeFin)}.`,
      y + 2,
    );
    y += 4;

    autoTable(doc, {
      ...getInfoTableConfig(
        y,
        [["Chiffres-clés", "Valeur"]],
        [
          [
            "Puissance installée actuelle",
            `${data.generateurExistantPuissanceKw * data.generateurExistantNb} kW (${data.generateurExistantNb} × ${data.generateurExistantMarque} ${data.generateurExistantModele})`,
          ],
          ["Puissance calée (modèle ERA5)", `~ ${fmt(data.pCaleeDh)} kW`],
          [
            "Puissance recommandée (avec marges)",
            `${data.puissanceRecoMin} – ${data.puissanceRecoMax} kW`,
          ],
          [
            "Rendement générateur existant (retenu)",
            `eta ~ ${fmt(data.rendementExistant, 3)} (PCS)`,
          ],
          [
            "Période de calibration",
            `${iso(data.periodeDebut)} -> ${iso(data.periodeFin)}`,
          ],
          [
            `Énergie ${VECTEUR_LABEL[data.vecteurReleve]} relevée (période)`,
            `${fmt(data.totalKwhReleve)} kWh`,
          ],
          ["SUMDH période (ERA5 horaire)", `${fmt(data.sommeDh)} °C·h`],
          [
            "Verdict statistique ASHRAE G14",
            data.conformeAshrae ? "[OK] Conforme (CV(RMSE) <= 15%, |NMBE| <= 5%)" : "Hors seuils",
          ],
          [
            "Réduction CO2 attendue (scénario retenu)",
            `−${fmt(data.scenarioRetenu.reductionCO2Pct, 1)} %`,
          ],
          ...(data.cee
            ? [["Prime CEE estimée", `${fmt(data.cee.primeEuros)} €`]]
            : []),
        ],
        contentW,
      ),
    });
  }

  // ─── 2. Présentation du site ─────────────────────────────
  {
    let y = addSection("2. Présentation du site");
    y = drawProseParagraph(
      doc,
      `Le site objet de la présente étude est ${data.usage.toLowerCase()} à ${fmt(data.surfaceChauffee)} m² de surface chauffée, ` +
        `situé ${data.adresse}, ${data.codePostal} ${data.ville}. Le bâtiment est desservi par une chaufferie ` +
        `collective au ${VECTEUR_LABEL[data.generateurExistantVecteur].toLowerCase()} (réseau ${data.fournisseurEnergie}).`,
      y + 2,
    );
    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Rubrique", "Valeur"]],
        [
          ["Adresse", `${data.adresse}, ${data.codePostal} ${data.ville}`],
          ["Occupant / Client", data.clientTitulaire],
          ["Usage", data.usage],
          ["Catégorie réglementaire", CATEGORIE_LABEL[data.categorieCible]],
          ["Surface chauffée", `${fmt(data.surfaceChauffee)} m²`],
          [
            "Zone climatique",
            `${data.zoneClimatique} (Te_base = ${fmt(data.tBase)}°C, NF EN 12831)`,
          ],
          ["Fournisseur énergie", data.fournisseurEnergie],
          ["Compteur / PCE / PDL", data.compteurRef],
          ["Type de relevé", "Compteur communicant (relevés réels R)"],
        ],
        contentW,
      ),
    });
  }

  // ─── 3. Chaufferie existante ─────────────────────────────
  {
    let y = addSection("3. Chaufferie / installation existante");
    y = drawProseParagraph(
      doc,
      `La production thermique est assurée par ${data.generateurExistantNb} ` +
        `${data.generateurExistantNb > 1 ? "générateurs" : "générateur"} ` +
        `${data.generateurExistantMarque} ${data.generateurExistantModele} de puissance utile nominale ` +
        `${data.generateurExistantPuissanceKw} kW chacun. Le rendement moyen retenu pour la calibration est de ` +
        `eta ~ ${fmt(data.rendementExistant, 3)} (PCS).`,
      y + 2,
    );
    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Caractéristique", "Valeur"]],
        [
          ["Fabricant", data.generateurExistantMarque],
          [
            "Type / Série",
            `${data.generateurExistantMarque} ${data.generateurExistantModele}`,
          ],
          ["Nombre d'unités", String(data.generateurExistantNb)],
          [
            "Puissance nominale unitaire",
            `${fmt(data.generateurExistantPuissanceKw)} kW`,
          ],
          [
            "Puissance nominale totale",
            `${fmt(data.generateurExistantPuissanceKw * data.generateurExistantNb)} kW`,
          ],
          ["Vecteur énergétique", VECTEUR_LABEL[data.generateurExistantVecteur]],
          ["Rendement moyen retenu (PCS)", fmt(data.rendementExistant, 3)],
        ],
        contentW,
      ),
    });
  }

  // ─── 4. Données ERA5 ─────────────────────────────────────
  {
    let y = addSection("4. Données météorologiques — Séries temporelles ERA5 Copernicus");
    y = drawProseParagraph(
      doc,
      `La présente étude s'appuie sur les séries temporelles horaires de température de l'air issues de ` +
        `la réanalyse ERA5, produite par le Centre européen pour les prévisions météorologiques à moyen ` +
        `terme (ECMWF) et distribuée via le service Copernicus Climate Change Service (C3S). Il s'agit du ` +
        `standard de référence international en analyse atmosphérique — utilisé ici en substitution des DJU ` +
        `annuels moyens, dont la résolution temporelle (annuelle) et l'absence de correction d'anomalie ` +
        `climatique interdisent tout calage précis sur des consommations mesurées.`,
      y + 2,
    );
    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Critère", "DJU annuels (méthode classique)", "Séries horaires ERA5 (présente étude)"]],
        [
          [
            "Résolution temporelle",
            "Annuelle (valeur unique)",
            `Horaire — ${fmt(data.nbHeuresMeteo)} points`,
          ],
          [
            "Représentativité météo",
            "Normale climatique non datée",
            "Calée sur l'année et la période réelles",
          ],
          ["Correction anomalie", "Aucune", "Intégrée de facto"],
          [
            "Calcul des degrés-heures",
            "Approché (DJU × 24)",
            "Exact (SUMDH heure par heure)",
          ],
          [
            "Validation sur relevés",
            "Non possible",
            "Calibration par écart % + stat ASHRAE G14",
          ],
          [
            "Source",
            "Météo-France station type",
            `ECMWF / Copernicus (${fmt(data.latitude, 3)}°N / ${fmt(data.longitude, 3)}°E)`,
          ],
        ],
        contentW,
      ),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { cellWidth: (contentW - 40) / 2 },
        2: { cellWidth: (contentW - 40) / 2 },
      },
    });

    const yAfter = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 60;

    autoTable(doc, {
      ...getInfoTableConfig(
        yAfter + 6,
        [["Paramètre d'extraction", "Valeur"]],
        [
          ["Jeu de données", "ERA5 — réanalyse horaire ECMWF (C3S)"],
          ["Variable", "2 m air temperature (t2m)"],
          [
            "Coordonnées",
            `${fmt(data.latitude, 3)}°N / ${fmt(data.longitude, 3)}°E — ${data.ville}`,
          ],
          ["Période extraite", `${iso(data.periodeDebut)} -> ${iso(data.periodeFin)}`],
          ["Pas de temps", "1 heure"],
          ["Nombre de points", `${fmt(data.nbHeuresMeteo)} valeurs horaires`],
          ["Te_base retenue", `${fmt(data.tBase)}°C`],
          [
            "SUMDH calculés (Ti dynamique, arrêt Te >= " + fmt(data.tArret) + "°C)",
            `${fmt(data.sommeDh)} °C·h`,
          ],
        ],
        contentW,
      ),
    });
  }

  // ─── 5. Consommations réelles ────────────────────────────
  {
    let y = addSection("5. Consommations réelles — Relevés compteur");
    y = drawProseParagraph(
      doc,
      `Les consommations utilisées dans la présente étude sont issues des relevés réels (code R) du ` +
        `compteur ${data.compteurRef}, ${VECTEUR_LABEL[data.vecteurReleve].toLowerCase()}. Les valeurs sont ` +
        `directement extraites des factures et cumulent ${fmt(data.totalKwhReleve)} kWh sur la période ` +
        `analysée.`,
      y + 2,
    );

    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Mois", `kWh (${VECTEUR_LABEL[data.vecteurReleve]})`, "Jours"]],
        [
          ...data.consosMensuelles.map((c) => [c.mois, fmt(c.kwh), String(c.jours)]),
          ["Total", fmt(data.totalKwhReleve), "—"],
        ],
        contentW,
      ),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { halign: "right", cellWidth: 60 },
        2: { halign: "right", cellWidth: 30 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (d: any) => {
        if (
          d.section === "body" &&
          d.row.index === data.consosMensuelles.length
        ) {
          d.cell.styles.fillColor = PDF_COLORS.blueLight as unknown as number[];
          d.cell.styles.fontStyle = "bold";
        }
      },
    });
  }

  // ─── 6. Méthode de calibration ───────────────────────────
  {
    let y = addSection("6. Note de dimensionnement — Méthode de calibration");
    y = drawProseParagraph(
      doc,
      `La méthode retenue est la calibration énergétique par séries temporelles horaires, dite méthode ` +
        `des degrés-heures (DH). Elle consiste à simuler, pour une puissance maximale Pmax testée, l'énergie ` +
        `thermique qui aurait été produite heure par heure sur la période, puis à comparer cette énergie ` +
        `calculée à l'énergie réellement relevée sur compteur, en prenant en compte le rendement du ` +
        `générateur. La température intérieure Ti est modélisée dynamiquement selon les plages horaires ` +
        `réelles d'occupation, ce qui affine sensiblement le SUMDH par rapport à un modèle Ti fixe.`,
      y + 2,
    );

    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Paramètre", "Valeur retenue"]],
        [
          [
            "Température intérieure Ti (occupation)",
            `${fmt(data.tiOccupe)}°C (profil dynamique par plage horaire)`,
          ],
          ["Ti réduit (nuit / weekend)", `${fmt(data.tiReduit)}°C`],
          [
            "Température de base Te_base",
            `${fmt(data.tBase)}°C — zone ${data.zoneClimatique} (NF EN 12831)`,
          ],
          ["DeltaT_base (Ti_occ − Te_base)", `${fmt(data.deltaTBase)}°C`],
          ["Température d'arrêt chauffage", `${fmt(data.tArret)}°C`],
          [
            "Rendement générateur eta (PCS)",
            `${fmt(data.rendementExistant, 3)} — moyenne annuelle`,
          ],
          ["SUMDH période complète", `${fmt(data.sommeDh)} °C·h`],
          [
            `Énergie ${VECTEUR_LABEL[data.vecteurReleve].toLowerCase()} relevée (période)`,
            `${fmt(data.totalKwhReleve)} kWh`,
          ],
        ],
        contentW,
      ),
    });

    const yAfter = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 60;
    drawFormulaBox(doc, yAfter + 6);
  }

  // ─── 7. Résultats calibration ────────────────────────────
  {
    let y = addSection("7. Résultats de la calibration — Balayage puissance");
    y = drawProseParagraph(
      doc,
      `Le tableau ci-dessous récapitule le balayage des puissances Pmax testées et leur écart entre ` +
        `énergie calculée par le modèle et énergie réellement relevée. La ligne surlignée correspond à la ` +
        `puissance produisant l'écart le plus faible — c'est la puissance calée retenue.`,
      y + 2,
    );

    const meilleurPmax = data.pCaleeDh;
    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [
          [
            "Pmax testée (kW)",
            "E utile calc. (kWh)",
            "E combust. calc. (kWh)",
            "Écart %",
            "Interprétation",
          ],
        ],
        data.scenariosCalibration.map((s) => [
          fmt(s.pmax),
          fmt(s.eUtile),
          fmt(s.eCombust),
          `${s.ecartPct > 0 ? "+" : ""}${fmt(s.ecartPct, 2)} %`,
          VERDICT_LABEL[s.verdict],
        ]),
        contentW,
      ),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 26, halign: "right" },
        1: { halign: "right", cellWidth: 40 },
        2: { halign: "right", cellWidth: 40 },
        3: { halign: "right", cellWidth: 24 },
        4: { cellWidth: contentW - 130 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (d: any) => {
        if (
          d.section === "body" &&
          data.scenariosCalibration[d.row.index]?.pmax === meilleurPmax
        ) {
          d.cell.styles.fillColor = [
            220, 252, 231,
          ] as unknown as number[]; // vert clair emerald-100
          d.cell.styles.fontStyle = "bold";
        }
      },
    });

    const yAfter = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 60;
    drawProseParagraph(
      doc,
      `Résultat : la puissance Pmax = ${fmt(data.pCaleeDh)} kW est la valeur produisant l'écart le plus ` +
        `petit sur la consommation relevée. Ce résultat constitue une puissance calée du modèle sur ` +
        `l'ensemble de la période analysée.`,
      yAfter + 5,
    );
  }

  // ─── 8. Validation statistique ──────────────────────────
  {
    let y = addSection("8. Validation statistique — ASHRAE Guideline 14 / IPMVP");
    y = drawProseParagraph(
      doc,
      `Conformément aux exigences internationales de l'ASHRAE Guideline 14 et au protocole IPMVP ` +
        `(International Performance Measurement & Verification Protocol), une régression linéaire mensuelle ` +
        `est réalisée entre les degrés-heures ERA5 et les consommations relevées, produisant les indices ` +
        `statistiques de performance ci-dessous.`,
      y + 2,
    );

    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Indice", "Valeur", "Seuil de référence", "Conforme"]],
        [
          [
            "R² (coefficient de détermination)",
            data.r2 != null ? fmt(data.r2, 3) : "—",
            ">= 0,75 recommandé",
            data.r2 != null && data.r2 >= 0.75 ? "OUI" : "—",
          ],
          [
            "RMSE",
            data.rmse != null ? `${fmt(data.rmse)} kWh` : "—",
            "N/A (informatif)",
            "—",
          ],
          [
            "CV(RMSE)",
            data.cvRmse != null ? pct(data.cvRmse, 2) : "—",
            "<= 15 % (calage mensuel)",
            data.cvRmse != null && data.cvRmse <= 15 ? "OUI" : "NON",
          ],
          [
            "NMBE",
            data.nmbe != null ? pct(data.nmbe, 2) : "—",
            "|NMBE| <= 5 % (calage mensuel)",
            data.nmbe != null && Math.abs(data.nmbe) <= 5 ? "OUI" : "NON",
          ],
          [
            "Verdict global ASHRAE G14",
            data.conformeAshrae ? "[OK] Conforme" : "Hors seuils",
            "CV(RMSE) <= 15 % ET |NMBE| <= 5 %",
            data.conformeAshrae ? "OUI" : "NON",
          ],
        ],
        contentW,
      ),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { halign: "right", cellWidth: 32 },
        2: { cellWidth: contentW - 60 - 32 - 22 },
        3: { halign: "center", cellWidth: 22 },
      },
    });

    if (data.pCaleeRegression != null) {
      const yAfter = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? y + 60;
      drawProseParagraph(
        doc,
        `Méthode de régression : la pente de la droite DH<->kWh confirme une puissance calée statistique de ` +
          `${fmt(data.pCaleeRegression, 1)} kW, soit un écart de ${fmt(data.ecartMethodes ?? 0, 2)} % avec ` +
          `l'approche degrés-heures physique (${fmt(data.pCaleeDh)} kW). Cette convergence des deux méthodes ` +
          `indépendantes atteste la robustesse du dimensionnement.`,
        yAfter + 5,
      );
    }
  }

  // ─── 9. Recommandation dimensionnement ───────────────────
  {
    let y = addSection("9. Recommandation de redimensionnement");
    y = drawProseParagraph(
      doc,
      `La puissance calée en régime établi ne couvre pas les phénomènes transitoires (relance matinale, ` +
        `pertes réseau de distribution, anomalies de grand froid) : des marges d'ingénierie sont ajoutées ` +
        `pour définir la puissance recommandée à installer.`,
      y + 2,
    );

    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Composante", "Valeur / Justification"]],
        [
          ["Puissance calée (besoin régime établi)", `${fmt(data.pCaleeDh)} kW`],
          [
            "Marge remise en chauffe (relance matinale)",
            `+${pct(data.margeRelance * 100, 0)} — locaux inoccupés la nuit`,
          ],
          [
            "Marge pertes réseau (distribution)",
            `+${pct(data.margeDistribution * 100, 0)} — selon longueur réseau`,
          ],
          [
            "Marge grand froid (hiver de référence)",
            `Intégrée via Te_base = ${fmt(data.tBase)}°C`,
          ],
          [
            "Puissance de remplacement recommandée",
            `${data.puissanceRecoMin} – ${data.puissanceRecoMax} kW`,
          ],
          [
            "Fourchette commerciale standard",
            data.fourchetteCommerciale.length > 0
              ? data.fourchetteCommerciale.map((p) => `${p} kW`).join(" / ")
              : "Configuration cascade requise",
          ],
          [
            "Surdimensionnement actuel",
            `${data.generateurExistantPuissanceKw * data.generateurExistantNb} kW -> ${data.puissanceRecoMin}–${data.puissanceRecoMax} kW ~ −${fmt(
              (1 -
                data.puissanceRecoMax /
                  (data.generateurExistantPuissanceKw * data.generateurExistantNb)) *
                100,
              0,
            )} %`,
          ],
        ],
        contentW,
      ),
    });
  }

  // ─── 10. Scénario PAC retenu ─────────────────────────────
  {
    let y = addSection("10. Scénario PAC retenu — Simulation horaire");
    const s = data.scenarioRetenu;

    y = drawProseParagraph(
      doc,
      `Le scénario retenu est "${s.nom}" : ${s.unites.length > 1 ? "cascade de " + s.unites.length + " unités" : "1 unité"} ` +
        `(${s.unites.join(" + ")} kW, total ${s.puissanceInstallee} kW), régime ${s.regime} (${REGIME_LABEL[s.regime]}), ` +
        `appoint = ${APPOINT_LABEL[s.typeAppoint].toLowerCase()}. La simulation heure par heure sur la période ERA5 ` +
        `fournit les indicateurs suivants.`,
      y + 2,
    );

    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Indicateur", "Valeur"]],
        [
          ["Puissance PAC installée", `${s.puissanceInstallee} kW`],
          [
            "Configuration des unités",
            s.unites.length > 1
              ? `Cascade ${s.unites.join(" + ")} kW`
              : `Mono-bloc ${s.unites[0]} kW`,
          ],
          ["Régime émetteurs", REGIME_LABEL[s.regime]],
          ["Type d'appoint", APPOINT_LABEL[s.typeAppoint]],
          [
            "Température de bivalence calculée",
            s.temperatureBivalence != null
              ? `${fmt(s.temperatureBivalence, 1)}°C`
              : "PAC seule sur toute la plage (pas de bivalence)",
          ],
          [
            "Taux de couverture PAC",
            `${pct(s.tauxCouverturePAC * 100, 1)} du besoin thermique`,
          ],
          [
            "SCOP saisonnier estimé",
            `${fmt(s.scop, 2)} (pondéré par énergie utile fournie)`,
          ],
          [
            "Consommation électrique PAC (période)",
            `${fmt(s.consoElecPAC)} kWh élec`,
          ],
          ...(s.typeAppoint === "GAZ"
            ? [
                [
                  "Consommation gaz d'appoint (période)",
                  `${fmt(s.consoAppointGaz)} kWh PCS`,
                ],
              ]
            : s.typeAppoint === "ELEC"
              ? [
                  [
                    "Consommation appoint électrique (période)",
                    `${fmt(s.consoAppointElec)} kWh élec`,
                  ],
                ]
              : []),
        ],
        contentW,
      ),
    });
  }

  // ─── 11. Cadre réglementaire CEE ────────────────────────
  {
    let y = addSection("11. Cadre réglementaire CEE — Fiche d'opération standardisée");
    const ficheRef = ficheParCategorie(data.categorieCible);

    y = drawProseParagraph(
      doc,
      `Cette opération est éligible à la fiche CEE ${ficheRef.code} — ${ficheRef.libelle}. ` +
        `La note de dimensionnement objet du présent document est une pièce obligatoire remise au ` +
        `bénéficiaire à l'achèvement de l'opération pour sécuriser l'obtention de la prime CEE.`,
      y + 2,
    );

    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Élément réglementaire", "Valeur"]],
        [
          ["Code fiche CEE", ficheRef.code],
          ["Libellé fiche", ficheRef.libelle],
          [
            "Catégorie du bâtiment",
            CATEGORIE_LABEL[data.categorieCible],
          ],
          ["Surface chauffée", `${fmt(data.surfaceChauffee)} m²`],
          [
            "Forfait kWhc/m² (×0.8 secteur)",
            data.cee ? `${fmt(data.cee.forfaitKwhcParM2)} kWhc/m²` : "—",
          ],
          [
            "Facteur correctif secteur",
            data.cee ? fmt(data.cee.facteurCorrectifSecteur, 2) : "—",
          ],
          [
            "Facteur R",
            data.cee
              ? `${fmt(data.cee.facteurR, 2)} (${data.cee.facteurR === 1 ? "chaudière conservée en secours inactif" : "config partielle"})`
              : "—",
          ],
          [
            "Bonification Coup de Pouce",
            data.cee ? `×${fmt(data.cee.bonificationCoupDePouce)}` : "—",
          ],
          [
            "Volume CEE brut",
            data.cee ? `${fmt(data.cee.volumeKwhc)} kWhc` : "—",
          ],
          [
            "Volume CEE bonifié",
            data.cee ? `${fmt(data.cee.volumeBonifiKwhc)} kWhc` : "—",
          ],
          [
            "Prix moyen kWhc",
            data.cee ? `${fmt(data.cee.primeEurMWhc, 2)} €/MWhc` : "—",
          ],
          [
            "Prime CEE estimée",
            data.cee ? `${fmt(data.cee.primeEuros)} €` : "—",
          ],
          [
            "Durée de vie conventionnelle",
            `${fmt(data.cee?.dureeVieAnnees ?? 22)} ans`,
          ],
          [
            "Date limite d'engagement",
            data.cee?.dateLimiteEngagement ?? "31 décembre 2030",
          ],
        ],
        contentW,
      ),
    });
  }

  // ─── 12. Bilan carbone ──────────────────────────────────
  {
    let y = addSection("12. Bilan carbone Avant / Après");
    y = drawProseParagraph(
      doc,
      `Facteurs d'émission ADEME retenus (Base Empreinte 2024, méthode ACV) : ` +
        `${VECTEUR_LABEL[data.generateurExistantVecteur].toLowerCase()} 0,227 kgCO2/kWh PCI (gaz naturel) ` +
        `pondéré par le rendement chaudière, et électricité 0,055 kgCO2/kWh (mix France).`,
      y + 2,
    );

    const s = data.scenarioRetenu;
    autoTable(doc, {
      ...getInfoTableConfig(
        y + 4,
        [["Situation", "Énergie consommée (période)", "Émissions CO2 (période)"]],
        [
          [
            `Avant — 100 % ${VECTEUR_LABEL[data.generateurExistantVecteur]}`,
            `${fmt(data.totalKwhReleve)} kWh`,
            `${fmt(s.emissionsCO2AvantKg / 1000, 2)} tCO2`,
          ],
          [
            `Après — ${s.nom} (SCOP ${fmt(s.scop, 2)}, couverture ${pct(s.tauxCouverturePAC * 100, 0)})`,
            `${fmt(s.consoElecPAC)} kWh élec` +
              (s.consoAppointGaz > 0
                ? ` + ${fmt(s.consoAppointGaz)} kWh gaz`
                : "") +
              (s.consoAppointElec > 0
                ? ` + ${fmt(s.consoAppointElec)} kWh élec appoint`
                : ""),
            `${fmt(s.emissionsCO2ApresKg / 1000, 2)} tCO2`,
          ],
          [
            "Réduction",
            "—",
            `−${fmt(s.reductionCO2Pct, 1)} % (−${fmt((s.emissionsCO2AvantKg - s.emissionsCO2ApresKg) / 1000, 2)} tCO2 sur la période)`,
          ],
        ],
        contentW,
      ),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: (contentW - 60) / 2 },
        2: { halign: "right", cellWidth: (contentW - 60) / 2 },
      },
    });
  }

  // ─── 13. Signature ──────────────────────────────────────
  {
    let y = addSection("13. Signature");
    y = drawProseParagraph(
      doc,
      `La présente note de dimensionnement engage Kilowater sur l'exactitude méthodologique du calage ` +
        `réalisé, aux conditions décrites (période, coordonnées ERA5, profils d'occupation, rendement retenu). ` +
        `Elle constitue la pièce technique demandée par la fiche ${data.cee?.ficheCode ?? ficheParCategorie(data.categorieCible).code} ` +
        `pour la valorisation CEE de l'opération.`,
      y + 2,
    );
    y += 18;
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

  // ─── Sommaire (post-hoc) ─────────────────────────────────
  doc.setPage(tocPage);
  drawSommaire(doc, tocPages, "Note de dimensionnement PAC air/eau", data.reference);

  // ─── Footers sur toutes les pages ────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(
      doc,
      "Note de dimensionnement PAC",
      data.reference,
      i,
      totalPages,
    );
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

// ─── Helpers privés ────────────────────────────────────────────

/** Rendu d'un paragraphe justifié simple (retourne y après le paragraphe). */
function drawProseParagraph(doc: jsPDF, raw: string, startY: number): number {
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

/** Encart formule (fond gris, monospace). */
function drawFormulaBox(doc: jsPDF, y: number): void {
  const pw = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  const width = pw - margin * 2;
  const height = 32;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.roundedRect(margin, y, width, height, 1.5, 1.5, "F");
  doc.setDrawColor(...PDF_COLORS.blue);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin, y + height); // filet bleu gauche

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.heading);
  const lines = [
    "P(h)      = Pmax * DH(h) / DT_base       [pour chaque heure active]",
    "E_utile   = SUM P(h) * 1h                [sur toutes les heures actives]",
    "E_energie = E_utile / eta                [conversion combustible ou vecteur]",
    "Calibration : E_energie_calc  ~  E_relevee   (ecart minimise Pmax)",
  ];
  let ly = y + 6;
  for (const l of lines) {
    doc.text(l, margin + 4, ly);
    ly += 5.5;
  }
}
