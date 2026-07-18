/**
 * Météo horaire ERA5 réelle via Open-Meteo Archive API.
 *
 * Différence fondamentale avec meteo-horaire.ts (synthétique) : ici on charge
 * de la donnée satellitaire ERA5 (ECMWF/Copernicus) redistribuée gratuitement
 * par Open-Meteo, calée sur les coordonnées GPS exactes du site et la période
 * réelle — pas une normale climatique reconstruite.
 *
 * Utilisée pour la calibration énergétique (méthode degrés-heures dynamique)
 * conformément à ASHRAE Guideline 14 / protocole IPMVP.
 *
 * Endpoint (gratuit, sans clé) :
 *   https://archive-api.open-meteo.com/v1/archive
 *   ?latitude=48.5&longitude=2.58
 *   &start_date=2025-11-02&end_date=2026-05-01
 *   &hourly=temperature_2m
 *   &timezone=Europe/Paris
 *
 * Cache DB : table `meteo_horaire_cache`, clé composite (lat_r, lon_r, période),
 * lat/lon arrondis à 0.1° (résolution ERA5 ~0.25°).
 */

import { prisma } from "@/lib/db";

const OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

export interface MeteoHoraireReel {
  /** ISO string par heure locale (fuseau Europe/Paris). */
  timestamps: string[];
  /** Températures 2 m (°C), une valeur par heure. */
  tExt: number[];
  latitude: number;
  longitude: number;
  periodeDebut: Date;
  periodeFin: Date;
  source: "open-meteo-archive" | "cache";
}

/** Arrondit une coordonnée à 0.1° pour la clé de cache. */
function roundCoord(v: number): number {
  return Math.round(v * 10) / 10;
}

/** Formate une Date en YYYY-MM-DD (fuseau UTC-safe, on utilise UTC pour l'API). */
function toYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Charge la météo horaire ERA5 pour une zone/période donnée.
 * Vérifie d'abord le cache DB ; sinon appelle Open-Meteo et cache le résultat.
 *
 * @param latitude  Latitude en degrés décimaux (ex. 48.5)
 * @param longitude Longitude en degrés décimaux (ex. 2.58)
 * @param periodeDebut Date de début inclusive
 * @param periodeFin   Date de fin inclusive
 */
export async function fetchMeteoHoraireERA5(
  latitude: number,
  longitude: number,
  periodeDebut: Date,
  periodeFin: Date,
): Promise<MeteoHoraireReel> {
  const latR = roundCoord(latitude);
  const lonR = roundCoord(longitude);

  // 1. Cache DB
  const cached = await prisma.meteoHoraireCache.findUnique({
    where: {
      meteo_zone_periode: {
        latR,
        lonR,
        periodeDebut,
        periodeFin,
      },
    },
  });

  if (cached) {
    const payload = cached.payloadJson as { timestamps: string[]; tExt: number[] };
    return {
      timestamps: payload.timestamps,
      tExt: payload.tExt,
      latitude: latR,
      longitude: lonR,
      periodeDebut,
      periodeFin,
      source: "cache",
    };
  }

  // 2. Appel API Open-Meteo Archive
  const url = new URL(OPEN_METEO_ARCHIVE);
  url.searchParams.set("latitude", String(latR));
  url.searchParams.set("longitude", String(lonR));
  url.searchParams.set("start_date", toYmd(periodeDebut));
  url.searchParams.set("end_date", toYmd(periodeFin));
  url.searchParams.set("hourly", "temperature_2m");
  url.searchParams.set("timezone", "Europe/Paris");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Kilowater-Calibration/1.0 (contact@kilowater.fr)" },
  });

  if (!res.ok) {
    throw new Error(
      `Open-Meteo Archive ${res.status} ${res.statusText} — ${await res.text().catch(() => "")}`.trim(),
    );
  }

  const data = (await res.json()) as {
    hourly?: { time?: string[]; temperature_2m?: (number | null)[] };
    error?: boolean;
    reason?: string;
  };

  if (data.error) {
    throw new Error(`Open-Meteo Archive: ${data.reason ?? "erreur inconnue"}`);
  }

  const timestamps = data.hourly?.time ?? [];
  const tExtRaw = data.hourly?.temperature_2m ?? [];
  const tExt = tExtRaw.map((v) => (v == null ? Number.NaN : v));

  if (timestamps.length === 0) {
    throw new Error("Open-Meteo Archive : aucune donnée horaire retournée");
  }

  // 3. Cache
  await prisma.meteoHoraireCache.create({
    data: {
      latR,
      lonR,
      periodeDebut,
      periodeFin,
      payloadJson: { timestamps, tExt },
      source: "open-meteo-archive",
    },
  });

  return {
    timestamps,
    tExt,
    latitude: latR,
    longitude: lonR,
    periodeDebut,
    periodeFin,
    source: "open-meteo-archive",
  };
}

// ─── Températures intérieures dynamiques ─────────────────────────

/**
 * Profil d'occupation pour un bâtiment tertiaire (ex. école).
 * Toutes températures en °C. Semaine 0=Lundi ... 6=Dimanche.
 *
 * Défaut = école primaire (zone C : vacances scolaires à préciser hors modèle).
 */
export interface ProfilOccupation {
  tiOccupe: number;
  tiPrechauffe: number;
  tiSoiree: number;
  tiNuit: number;
  tiWeekend: number;
  tiVacances: number;
  /** Heure début préchauffe (0-23). */
  hPrechauffe: number;
  /** Heure début occupation. */
  hOccupeDebut: number;
  /** Heure fin occupation. */
  hOccupeFin: number;
  /** Heure début soirée / réduit. */
  hSoireeDebut: number;
  /** Heure début nuit. */
  hNuitDebut: number;
  /** Périodes de vacances (paires début/fin inclusives, Date). */
  vacances: Array<{ debut: Date; fin: Date }>;
}

export const PROFIL_ECOLE_DEFAULT: ProfilOccupation = {
  tiOccupe: 19,
  tiPrechauffe: 17,
  tiSoiree: 16,
  tiNuit: 15,
  tiWeekend: 14,
  tiVacances: 12,
  hPrechauffe: 6,
  hOccupeDebut: 8,
  hOccupeFin: 17,
  hSoireeDebut: 17,
  hNuitDebut: 20,
  vacances: [],
};

/** Retourne le Ti (°C) pour un timestamp ISO donné selon le profil. */
export function tiHoraire(isoTimestamp: string, profil: ProfilOccupation): number {
  const d = new Date(isoTimestamp);
  // Vacances (prioritaire)
  for (const v of profil.vacances) {
    if (d >= v.debut && d <= v.fin) return profil.tiVacances;
  }
  // Weekend (samedi=6, dimanche=0 en getDay)
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return profil.tiWeekend;
  // Jour ouvré : plages horaires
  const h = d.getHours();
  if (h >= profil.hPrechauffe && h < profil.hOccupeDebut) return profil.tiPrechauffe;
  if (h >= profil.hOccupeDebut && h < profil.hOccupeFin) return profil.tiOccupe;
  if (h >= profil.hSoireeDebut && h < profil.hNuitDebut) return profil.tiSoiree;
  return profil.tiNuit;
}

// ─── Calcul degrés-heures dynamique ──────────────────────────────

export interface DegreHeuresResultat {
  /** Σ DH sur la période (°C·h). */
  sommeDh: number;
  /** DH horaire (même longueur que timestamps). Zéro quand chauffage coupé. */
  dhHoraire: number[];
  /** Ti retenu heure par heure. */
  tiHoraireArr: number[];
  /** Nombre d'heures où chauffage actif (Te < tArret et ΔT > 0). */
  heuresActives: number;
  /** Agrégat mensuel (index 0 = 1er mois de la période). */
  mensuel: Array<{ mois: string; sommeDh: number; heures: number }>;
}

export interface DegreHeuresOptions {
  /** Profil d'occupation (Ti dynamique). */
  profil: ProfilOccupation;
  /** Seuil arrêt chauffage (Te ≥ tArret ⇒ chauffage coupé). */
  tArret: number;
}

/**
 * Calcule ΣDH horaire à partir des séries ERA5 et d'un profil d'occupation.
 *   DH(h) = max(0, Ti(h) - Te(h))  si Te(h) < tArret, sinon 0
 */
export function calculerDegreHeures(
  meteo: MeteoHoraireReel,
  options: DegreHeuresOptions,
): DegreHeuresResultat {
  const { profil, tArret } = options;
  const dhHoraire: number[] = new Array(meteo.tExt.length);
  const tiHoraireArr: number[] = new Array(meteo.tExt.length);
  let sommeDh = 0;
  let heuresActives = 0;

  const buckets = new Map<string, { sommeDh: number; heures: number }>();

  for (let i = 0; i < meteo.tExt.length; i++) {
    const te = meteo.tExt[i];
    const ts = meteo.timestamps[i];
    const ti = tiHoraire(ts, profil);
    tiHoraireArr[i] = ti;

    let dh = 0;
    if (Number.isFinite(te) && te < tArret) {
      dh = Math.max(0, ti - te);
    }
    dhHoraire[i] = dh;
    sommeDh += dh;
    if (dh > 0) heuresActives++;

    // Bucket mensuel YYYY-MM
    const moisKey = ts.slice(0, 7);
    const b = buckets.get(moisKey) ?? { sommeDh: 0, heures: 0 };
    b.sommeDh += dh;
    if (dh > 0) b.heures++;
    buckets.set(moisKey, b);
  }

  const mensuel = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mois, v]) => ({ mois, sommeDh: v.sommeDh, heures: v.heures }));

  return { sommeDh, dhHoraire, tiHoraireArr, heuresActives, mensuel };
}
