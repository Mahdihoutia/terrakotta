/**
 * Bibliothèque de coefficients ψ (psi) pour ponts thermiques linéaires.
 *
 * Source : règles Th-U fascicule 5/5 — méthode RT existant
 * (arrêté du 8 août 2008 et mise à jour 2017).
 *
 * Les valeurs sont indicatives pour audit énergétique.
 * Pour un projet sensible (BBC, RE2020, garantie de performance),
 * un calcul détaillé par BET est nécessaire.
 */

export type TypeIsolation = "ITE" | "ITI" | "ITR" | "Aucune";

export type TypeLiaison =
  | "MUR_DALLE_INTERMEDIAIRE"
  | "MUR_PLANCHER_BAS"
  | "MUR_TOITURE"
  | "MUR_REFEND"
  | "MENUISERIE_TUNNEL"
  | "MENUISERIE_NU_INTERIEUR"
  | "MENUISERIE_NU_EXTERIEUR"
  | "BALCON_NON_ROMPU"
  | "BALCON_RUPTEUR";

/** ψ en W/m·K selon la typologie de liaison et l'isolation du mur porteur. */
export const PSI_LIBRARY: Record<TypeLiaison, Record<TypeIsolation, number>> = {
  MUR_DALLE_INTERMEDIAIRE: { ITE: 0.05, ITI: 0.95, ITR: 0.10, Aucune: 0.85 },
  MUR_PLANCHER_BAS:        { ITE: 0.20, ITI: 0.85, ITR: 0.55, Aucune: 0.70 },
  MUR_TOITURE:             { ITE: 0.05, ITI: 0.65, ITR: 0.15, Aucune: 0.55 },
  MUR_REFEND:              { ITE: 0.02, ITI: 0.65, ITR: 0.10, Aucune: 0.55 },
  MENUISERIE_TUNNEL:       { ITE: 0.02, ITI: 0.05, ITR: 0.05, Aucune: 0.05 },
  MENUISERIE_NU_INTERIEUR: { ITE: 0.45, ITI: 0.10, ITR: 0.40, Aucune: 0.10 },
  MENUISERIE_NU_EXTERIEUR: { ITE: 0.05, ITI: 0.45, ITR: 0.10, Aucune: 0.45 },
  BALCON_NON_ROMPU:        { ITE: 0.90, ITI: 0.95, ITR: 0.85, Aucune: 0.95 },
  BALCON_RUPTEUR:          { ITE: 0.30, ITI: 0.40, ITR: 0.30, Aucune: 0.40 },
};

export interface PontThermique {
  typo: TypeLiaison;
  longueur: number;
  isolation: TypeIsolation;
}

export interface PontsThermiquesResult {
  hTotal: number;
  detail: Array<{ typo: TypeLiaison; longueur: number; psi: number; h: number }>;
}

/**
 * Calcule la déperdition par ponts thermiques : H_pt = Σ ψ × L (W/K).
 */
export function calculerPontsThermiques(ponts: PontThermique[]): PontsThermiquesResult {
  const detail = ponts.map((p) => {
    const psi = PSI_LIBRARY[p.typo]?.[p.isolation] ?? 0;
    const h = psi * p.longueur;
    return { typo: p.typo, longueur: p.longueur, psi, h };
  });
  const hTotal = detail.reduce((s, d) => s + d.h, 0);
  return { hTotal, detail };
}

/**
 * Estimation forfaitaire des ponts thermiques quand le détail
 * n'est pas saisi : ratio sur la déperdition par parois opaques.
 *  - ITE : 5 %
 *  - ITI : 25 %
 *  - ITR (réparti) : 10 %
 *  - Aucune isolation : 20 %
 */
export function estimerPontsForfaitaire(hParoisOpaques: number, isolation: TypeIsolation): number {
  const ratios: Record<TypeIsolation, number> = {
    ITE: 0.05, ITI: 0.25, ITR: 0.10, Aucune: 0.20,
  };
  return hParoisOpaques * ratios[isolation];
}

/**
 * Mappe le libellé "Isolation murs" du formulaire d'audit vers TypeIsolation.
 */
export function mapIsolationMurLabel(label: string | undefined | null): TypeIsolation {
  if (!label) return "Aucune";
  const s = label.toLowerCase();
  if (s.includes("extérieure") || s.includes("ite")) return "ITE";
  if (s.includes("intérieure") || s.includes("iti")) return "ITI";
  if (s.includes("répartie") || s.includes("itr")) return "ITR";
  return "Aucune";
}
