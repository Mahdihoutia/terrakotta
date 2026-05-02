/**
 * Types partagés par le studio Bilan Thermique et ses drawers.
 * Reflètent les payloads sérialisés par lib/api-helpers/* — gardés volontairement
 * stricts (pas de any) tout en restant tolérants aux champs optionnels.
 */

export interface MateriauDto {
  id: string;
  nom: string;
  categorie: string;
  marque: string | null;
  reference: string | null;
  conductivite: number;
  masseVolumique: number;
  capaciteThermique: number;
  resistanceVapeur: number | null;
  resistanceFixe: number | null;
  carboneACV: number | null;
  carboneFinDeVie: number | null;
  origineFdes: string | null;
  source: string | null;
  notes: string | null;
}

export interface CoucheDto {
  id?: string;
  ordre: number;
  epaisseur: number; // en mètres en BD
  materiauId: string;
  materiau?: {
    id: string;
    nom: string;
    categorie: string;
    conductivite: number;
    masseVolumique: number;
    capaciteThermique: number;
    resistanceFixe: number | null;
    carboneACV: number | null;
  };
}

export interface ParoiDto {
  id: string;
  nom: string;
  type: string;
  description: string | null;
  uCache: number | null;
  rCache: number | null;
  masseSurfaciqueCache: number | null;
  dephasageCache: number | null;
  carboneCache: number | null;
  rsi: number;
  rse: number;
  couches?: CoucheDto[];
}

export interface ScenarioDto {
  id: string;
  nom: string;
  description: string | null;
  pattern: ("OCC" | "RED" | "INOCC")[][];
  preset: boolean;
}

export interface BatimentDto {
  id: string;
  nom: string;
  description: string | null;
  zoneClimatique: string;
  altitude: number | null;
  orientation: string | null;
  projetId: string | null;
  auditDocumentId: string | null;
  zonesCount: number;
}

export interface ZoneParoiDto {
  id: string;
  zoneId: string;
  paroiId: string;
  surface: number;
  orientation: string | null;
  inclinaison: number | null;
  cotePaire: boolean;
  paroi: {
    id: string;
    nom: string;
    type: string;
    uCache: number | null;
    masseSurfaciqueCache: number | null;
  } | null;
}

export interface ZoneDto {
  id: string;
  batimentId: string;
  nom: string;
  usage: string;
  surface: number;
  hauteurSousPlafond: number;
  consigneChauffageOcc: number;
  consigneChauffageRed: number;
  consigneClimOcc: number;
  consigneClimRed: number;
  densiteOccupation: number;
  apportsParPersonne: number;
  apportsEquipements: number;
  apportsEclairage: number;
  qVmcM3hM2: number;
  efficaciteDoubleFlux: number;
  scenarioId: string | null;
  parois: ZoneParoiDto[];
}

export interface DrawerProps<T> {
  open: boolean;
  onClose: () => void;
  /** null/undefined = création, sinon édition */
  existing?: T | null;
  /** Callback après sauvegarde réussie */
  onSaved: (resource: T) => void;
}
