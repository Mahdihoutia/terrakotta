/**
 * Seed initial des scénarios d'occupation hebdomadaire.
 * Pattern : matrice 7×24 — lundi=0, dimanche=6 ; heure 0..23.
 * Codes : "OCC" (occupation pleine), "RED" (réduit nocturne / pause),
 *         "INOCC" (inoccupé total).
 */

export type OccupationCode = "OCC" | "RED" | "INOCC";
export type Pattern = OccupationCode[][]; // 7 × 24

export interface ScenarioSeed {
  nom: string;
  description: string;
  pattern: Pattern;
}

function buildJoursOuvres(occStart: number, occEnd: number, weekendCode: OccupationCode = "INOCC"): Pattern {
  const jours: Pattern = [];
  for (let j = 0; j < 7; j += 1) {
    const ligne: OccupationCode[] = [];
    const isWeekend = j >= 5;
    for (let h = 0; h < 24; h += 1) {
      if (isWeekend) {
        ligne.push(weekendCode);
      } else if (h >= occStart && h < occEnd) {
        ligne.push("OCC");
      } else if (
        (h >= occStart - 1 && h < occStart) ||
        (h >= occEnd && h < occEnd + 1)
      ) {
        ligne.push("RED");
      } else {
        ligne.push("INOCC");
      }
    }
    jours.push(ligne);
  }
  return jours;
}

function buildCommerce(occStart: number, occEnd: number, joursTravail: number): Pattern {
  const jours: Pattern = [];
  for (let j = 0; j < 7; j += 1) {
    const ligne: OccupationCode[] = [];
    const ferme = j >= joursTravail;
    for (let h = 0; h < 24; h += 1) {
      if (ferme) ligne.push("INOCC");
      else if (h >= occStart && h < occEnd) ligne.push("OCC");
      else ligne.push("INOCC");
    }
    jours.push(ligne);
  }
  return jours;
}

function buildLogement(): Pattern {
  // Présence forte 18h-7h tous les jours, réduit 7h-18h en semaine,
  // OCC plus large le weekend.
  const jours: Pattern = [];
  for (let j = 0; j < 7; j += 1) {
    const ligne: OccupationCode[] = [];
    const isWeekend = j >= 5;
    for (let h = 0; h < 24; h += 1) {
      if (h >= 22 || h < 7) ligne.push("OCC"); // nuit
      else if (h >= 7 && h < 9) ligne.push("OCC"); // matinée
      else if (h >= 18 && h < 22) ligne.push("OCC"); // soirée
      else if (isWeekend) ligne.push("OCC");
      else ligne.push("RED");
    }
    jours.push(ligne);
  }
  return jours;
}

function buildContinue(): Pattern {
  return Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => "OCC" as const),
  );
}

function buildScolaire(): Pattern {
  // 8h-17h, 5j/7. Pas de gestion vacances dans la matrice hebdo —
  // approximation : RED en weekend pour gardiennage.
  const jours: Pattern = [];
  for (let j = 0; j < 7; j += 1) {
    const ligne: OccupationCode[] = [];
    const isWeekend = j >= 5;
    for (let h = 0; h < 24; h += 1) {
      if (isWeekend) ligne.push("RED");
      else if (h >= 8 && h < 17) ligne.push("OCC");
      else if (h === 7 || h === 17) ligne.push("RED");
      else ligne.push("INOCC");
    }
    jours.push(ligne);
  }
  return jours;
}

export const SCENARIOS_SEED: ScenarioSeed[] = [
  {
    nom: "Bureaux 8h-18h, 5j/7",
    description: "Occupation tertiaire standard — lundi à vendredi, 8h-18h, weekend inoccupé.",
    pattern: buildJoursOuvres(8, 18, "INOCC"),
  },
  {
    nom: "Bureaux étendus 7h-20h, 5j/7",
    description: "Plage étendue type bureaux d'ingénierie — 7h-20h en semaine.",
    pattern: buildJoursOuvres(7, 20, "INOCC"),
  },
  {
    nom: "Commerce 9h-19h, 6j/7",
    description: "Commerce ouvert du lundi au samedi, fermé le dimanche.",
    pattern: buildCommerce(9, 19, 6),
  },
  {
    nom: "Logement standard",
    description: "Profil résidentiel — présence soir + nuit en semaine, large le weekend.",
    pattern: buildLogement(),
  },
  {
    nom: "Occupation continue 24h/24",
    description: "Local toujours actif — salle serveur, hôpital, hôtel.",
    pattern: buildContinue(),
  },
  {
    nom: "Établissement scolaire 8h-17h, 5j/7",
    description: "Cours en semaine 8h-17h ; gardiennage réduit le weekend.",
    pattern: buildScolaire(),
  },
];
