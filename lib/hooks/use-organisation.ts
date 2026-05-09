"use client";

import { useEffect, useState } from "react";

export interface OrganisationInfo {
  raisonSociale: string;
  formeJuridique: string | null;
  siret: string | null;
  codeApe: string | null;
  capital: number | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string | null;
  email: string | null;
  telephone: string | null;
  siteWeb: string | null;
  regimeTVA: string | null;
  mentionTVA: string | null;
  iban: string | null;
  bic: string | null;
  banqueNom: string | null;
  rgeNumero: string | null;
  rgeValiditeJusqu: string | null;
  decennaleCompagnie: string | null;
  decennalePolice: string | null;
  rcpCompagnie: string | null;
  rcpPolice: string | null;
  logoUrl: string | null;
  couleurAccent: string | null;
  conditionsPaiement: string | null;
  cgvUrl: string | null;
}

// Cache module-level — l'organisation change rarement, on évite de re-fetcher
// à chaque ouverture d'un document.
let cached: OrganisationInfo | null = null;
let inflight: Promise<OrganisationInfo | null> | null = null;

async function loadOrg(): Promise<OrganisationInfo | null> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/organisation", { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as OrganisationInfo | null;
      cached = data;
      return data;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Invalide le cache — à appeler après PATCH. */
export function invalidateOrganisation() {
  cached = null;
}

/** Récupère les infos du bureau (singleton). Renvoie null si jamais initialisé. */
export function useOrganisation(): OrganisationInfo | null {
  const [org, setOrg] = useState<OrganisationInfo | null>(cached);
  useEffect(() => {
    if (cached) {
      setOrg(cached);
      return;
    }
    let alive = true;
    loadOrg().then((d) => {
      if (alive) setOrg(d);
    });
    return () => {
      alive = false;
    };
  }, []);
  return org;
}
