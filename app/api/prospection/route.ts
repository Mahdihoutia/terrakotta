import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

/**
 * Prospection ciblée — sources publiques officielles uniquement.
 *
 * Historique : 14 « sources » étaient déclarées mais 12 d'entre elles
 * tapaient toutes le même endpoint `recherche-entreprises.api.gouv.fr`
 * avec un tag différent, et toutes fabriquaient des emails fictifs
 * (contact@slug.fr, etc.) ce qui aurait dégradé la délivrabilité du
 * domaine en cas de campagne. Nettoyage : on garde 2 sources réelles,
 * pas d'email fabriqué — l'utilisateur enrichit manuellement.
 *
 * Sources actives :
 *  - SIRENE     → registre officiel des entreprises (annuaire-entreprises)
 *  - DPE_ADEME  → diagnostics DPE F/G du parc résidentiel (open data ADEME)
 *
 * Les valeurs d'enum legacy (PAGES_JAUNES, BODACC, etc.) restent dans
 * `prisma/schema.prisma` pour compatibilité avec les leads existants ;
 * elles ne sont simplement plus proposées comme sources de recherche.
 */

interface ScrapedLead {
  nom: string;
  prenom?: string;
  email: string; // "" quand non disponible — à enrichir
  telephone?: string;
  raisonSociale?: string;
  siret?: string;
  fonction?: string;
  roleCible: string;
  type: "PARTICULIER" | "PROFESSIONNEL" | "COLLECTIVITE";
  source: "SIRENE" | "DPE_ADEME";
  sourceUrl?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  departement?: string;
  surfaceBatiment?: number;
  dpeEtiquette?: string;
  score: number;
  notes: string;
}

// ─── Départements Île-de-France + 100km ──────────────────────────

const IDF_DEPARTMENTS = [
  "75", "77", "78", "91", "92", "93", "94", "95",
  "02", "10", "28", "45", "51", "60", "89",
];

const IDF_CITIES_FALLBACK: Record<string, string> = {
  "75": "Paris", "77": "Melun", "78": "Versailles", "91": "Évry",
  "92": "Nanterre", "93": "Bobigny", "94": "Créteil", "95": "Cergy",
  "02": "Laon", "10": "Troyes", "28": "Chartres", "45": "Orléans",
  "51": "Reims", "60": "Beauvais", "89": "Auxerre",
};

const TARGET_ROLES = [
  "Gestionnaire Technique",
  "Gestionnaire de copropriété",
  "Property Manager",
  "Syndic de copropriété",
  "Maire",
  "Adjoint au Maire",
  "Directeur technique",
  "Responsable patrimoine",
  "Dirigeant",
  "Gestionnaire de patrimoine",
  "CEO / Directeur général",
];

// ─── Schema ──────────────────────────────────────────────────────

const ACTIVE_SOURCES = ["SIRENE", "DPE_ADEME"] as const;

// Inclut les valeurs legacy pour le filtrage GET (statistiques sur historique).
const ALL_LEGACY_SOURCES = [
  "SIRENE", "DPE_ADEME",
  "PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING", "BODACC", "BOAMP",
  "PERMIS_CONSTRUIRE", "LINKEDIN", "INFOGREFFE", "PAPPERS",
  "CADASTRE_DVF", "FRANCE_TRAVAIL", "ANNONCES_LEGALES",
] as const;

const searchSchema = z.object({
  sources: z.array(z.enum(ACTIVE_SOURCES)).min(1),
  roles: z.array(z.string()).optional(),
  departements: z.array(z.string()).optional(),
  surfaceMin: z.number().optional().default(1000),
  maxResults: z.number().optional().default(20),
});

// ─── POST /api/prospection ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const result = searchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { sources, roles, departements, surfaceMin, maxResults } = result.data;
    const targetRoles = roles?.length ? roles : TARGET_ROLES;
    const targetDepts = departements?.length ? departements : IDF_DEPARTMENTS;

    const scrapePromises: Promise<ScrapedLead[]>[] = [];
    if (sources.includes("SIRENE")) {
      scrapePromises.push(scrapeSirene(targetRoles, targetDepts, surfaceMin, maxResults));
    }
    if (sources.includes("DPE_ADEME")) {
      scrapePromises.push(scrapeDpeAdeme(targetDepts, surfaceMin, maxResults));
    }

    const results = await Promise.allSettled(scrapePromises);
    const allLeads: ScrapedLead[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") allLeads.push(...r.value);
    }

    // Dédup en mémoire — par SIRET ou par adresse+CP, pas par email (fabrique évitée).
    const seen = new Set<string>();
    const uniqueLeads = allLeads
      .filter((lead) => {
        const key = leadFingerprint(lead);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, maxResults);

    // Scoring sur signaux réels.
    for (const lead of uniqueLeads) {
      lead.score = calculateLeadScore(lead, surfaceMin);
    }
    uniqueLeads.sort((a, b) => b.score - a.score);

    // Persistance — dédup côté DB par SIRET ou par adresse normalisée.
    const savedLeads = [];
    for (const lead of uniqueLeads) {
      const exists = await leadAlreadyInDb(lead);
      if (exists) continue;

      const saved = await prisma.lead.create({
        data: {
          nom: lead.nom,
          prenom: lead.prenom ?? null,
          email: lead.email, // "" si non disponible — UI affiche « À enrichir »
          telephone: lead.telephone ?? null,
          raisonSociale: lead.raisonSociale ?? null,
          siret: lead.siret ?? null,
          fonction: lead.fonction ?? null,
          roleCible: lead.roleCible,
          type: lead.type,
          source: lead.source,
          statut: "NOUVEAU",
          adresse: lead.adresse ?? null,
          ville: lead.ville ?? null,
          codePostal: lead.codePostal ?? null,
          departement: lead.departement ?? null,
          surfaceBatiment: lead.surfaceBatiment ?? null,
          sourceUrl: lead.sourceUrl ?? null,
          score: lead.score,
          notes: lead.notes,
        },
      });
      savedLeads.push(saved);
    }

    return NextResponse.json({
      success: true,
      found: uniqueLeads.length,
      saved: savedLeads.length,
      duplicates: uniqueLeads.length - savedLeads.length,
      leads: savedLeads.map((l) => ({
        ...l,
        budgetEstime: l.budgetEstime ? Number(l.budgetEstime) : null,
        score: l.score ?? 0,
        dateCreation: l.dateCreation.toISOString().split("T")[0],
        dateMiseAJour: l.dateMiseAJour.toISOString().split("T")[0],
      })),
    });
  } catch (error) {
    console.error("[API /api/prospection POST]", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

// ─── GET /api/prospection — Statistiques ─────────────────────────

export async function GET() {
  try {
    const [total, bySource, byScore, byRole, byDepartement, recent] = await Promise.all([
      prisma.lead.count({ where: { source: { in: [...ALL_LEGACY_SOURCES] } } }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { source: { in: [...ALL_LEGACY_SOURCES] } },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["score"],
        where: { source: { in: [...ALL_LEGACY_SOURCES] } },
        _count: true,
        orderBy: { score: "desc" },
      }),
      prisma.lead.groupBy({
        by: ["roleCible"],
        where: {
          source: { in: [...ALL_LEGACY_SOURCES] },
          roleCible: { not: null },
        },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["departement"],
        where: {
          source: { in: [...ALL_LEGACY_SOURCES] },
          departement: { not: null },
        },
        _count: true,
      }),
      prisma.lead.findMany({
        where: { source: { in: [...ALL_LEGACY_SOURCES] } },
        orderBy: { dateCreation: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      total,
      bySource: bySource.map((s) => ({ source: s.source, count: s._count })),
      byScore: byScore.map((s) => ({ score: s.score ?? 0, count: s._count })),
      byRole: byRole.map((r) => ({ role: r.roleCible, count: r._count })),
      byDepartement: byDepartement.map((d) => ({ dept: d.departement, count: d._count })),
      recent: recent.map((l) => ({
        ...l,
        budgetEstime: l.budgetEstime ? Number(l.budgetEstime) : null,
        score: l.score ?? 0,
        dateCreation: l.dateCreation.toISOString().split("T")[0],
        dateMiseAJour: l.dateMiseAJour.toISOString().split("T")[0],
      })),
    });
  } catch (error) {
    console.error("[API /api/prospection GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function leadFingerprint(lead: ScrapedLead): string {
  if (lead.siret) return `siret:${lead.siret}`;
  if (lead.adresse && lead.codePostal) {
    return `addr:${lead.codePostal}|${lead.adresse.toLowerCase().replace(/\s+/g, " ").trim()}`;
  }
  return `name:${(lead.raisonSociale || lead.nom).toLowerCase().trim()}|${lead.codePostal ?? ""}`;
}

async function leadAlreadyInDb(lead: ScrapedLead): Promise<boolean> {
  if (lead.siret) {
    const found = await prisma.lead.findFirst({ where: { siret: lead.siret } });
    if (found) return true;
  }
  if (lead.adresse && lead.codePostal) {
    const found = await prisma.lead.findFirst({
      where: { adresse: lead.adresse, codePostal: lead.codePostal },
    });
    if (found) return true;
  }
  return false;
}

function getCityForDept(dept: string): string {
  return IDF_CITIES_FALLBACK[dept] || "—";
}

/**
 * Score sur signaux d'intention réels — pas un cumul de cases remplies.
 *
 *  +3 : DPE F ou G (déclencheur réglementaire fort)
 *  +2 : surface > 2× le seuil minimum demandé
 *  +1 : surface > seuil minimum demandé
 *  +1 : IDF cœur (75 / 92 / 93 / 94) — proximité commerciale
 *  +1 : présence d'un téléphone (canal direct utilisable)
 */
function calculateLeadScore(lead: ScrapedLead, surfaceMin: number): number {
  let score = 1;

  if (lead.dpeEtiquette === "F" || lead.dpeEtiquette === "G") score += 3;

  if (lead.surfaceBatiment) {
    if (lead.surfaceBatiment >= surfaceMin * 2) score += 2;
    else if (lead.surfaceBatiment >= surfaceMin) score += 1;
  }

  if (lead.departement && ["75", "92", "93", "94"].includes(lead.departement)) {
    score += 1;
  }

  if (lead.telephone) score += 1;

  return Math.min(score, 5);
}

// ─── Source : SIRENE (annuaire-entreprises.data.gouv.fr) ─────────

async function scrapeSirene(
  roles: string[],
  depts: string[],
  surfaceMin: number,
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  // Activités principales NAF ciblées : gestion immo / syndic / BE thermique
  // 68.32A : Administration d'immeubles
  // 68.20B : Location terrains et autres biens immobiliers
  // 68.31Z : Agences immobilières
  // 71.12B : Ingénierie études techniques
  const queries = [
    { q: "syndic copropriete", role: "Syndic de copropriété", naf: "68.32A" },
    { q: "gestion patrimoine immobilier", role: "Gestionnaire de patrimoine", naf: "68.32A,68.20B" },
    { q: "administration biens immobiliers", role: "Property Manager", naf: "68.32A,68.31Z" },
    { q: "fonciere immobiliere", role: "Dirigeant", naf: "68.20B" },
  ];

  for (const sq of queries) {
    if (leads.length >= maxResults) break;
    if (!roles.some((r) => sq.role.includes(r) || r.includes(sq.role))) continue;

    try {
      const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(sq.q)}&departement=${depts.slice(0, 8).join(",")}&page=1&per_page=10&activite_principale=${sq.naf}`;

      const response = await fetch(apiUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Kilowater-Prospection/1.0 (contact@kilowater.fr)",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const data = await response.json() as {
        results?: Array<{
          nom_complet?: string;
          siren?: string;
          siege?: {
            adresse?: string;
            libelle_commune?: string;
            code_postal?: string;
            departement?: string;
            siret?: string;
          };
          dirigeants?: Array<{ nom?: string; prenoms?: string; qualite?: string }>;
          tranche_effectif_salarie?: string;
          nombre_etablissements?: number;
        }>;
      };

      if (!data.results) continue;

      for (const ent of data.results) {
        if (leads.length >= maxResults) break;
        if (!ent.nom_complet) continue;

        const dirigeant = ent.dirigeants?.[0];
        leads.push({
          nom: dirigeant?.nom || ent.nom_complet,
          prenom: dirigeant?.prenoms || undefined,
          email: "", // À enrichir — pas d'email fabriqué.
          raisonSociale: ent.nom_complet,
          siret: ent.siege?.siret || (ent.siren ? `${ent.siren}00000` : undefined),
          fonction: dirigeant?.qualite || undefined,
          roleCible: sq.role,
          type: "PROFESSIONNEL",
          source: "SIRENE",
          sourceUrl: ent.siren
            ? `https://annuaire-entreprises.data.gouv.fr/entreprise/${ent.siren}`
            : undefined,
          adresse: ent.siege?.adresse || undefined,
          ville: ent.siege?.libelle_commune || undefined,
          codePostal: ent.siege?.code_postal || undefined,
          departement: ent.siege?.departement || depts[0],
          surfaceBatiment: undefined, // Non disponible en SIRENE — surfaceMin appliquée côté DPE.
          score: 0,
          notes:
            `[SIRENE] ${sq.role} · ${ent.nom_complet}` +
            (ent.tranche_effectif_salarie ? ` · Effectif: ${ent.tranche_effectif_salarie}` : "") +
            ` · ${ent.nombre_etablissements ?? 1} établissement(s) — Email à enrichir manuellement.`,
        });
      }
    } catch {
      continue;
    }
  }

  // surfaceMin n'est pas filtrant pour SIRENE (pas de surface dans la source).
  void surfaceMin;
  return leads;
}

// ─── Source : DPE ADEME (open data résidentiel F/G) ──────────────

async function scrapeDpeAdeme(
  depts: string[],
  surfaceMin: number,
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  for (const dept of depts.slice(0, 4)) {
    if (leads.length >= maxResults) break;
    try {
      const apiUrl = `https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants/lines?size=${Math.min(maxResults, 15)}&q_fields=code_departement_(ban)&qs=code_departement_(ban):"${dept}"&select=N°DPE,Etiquette_DPE,Nom__commune_(BAN),Code_postal_(BAN),Surface_habitable_logement,Date_établissement_DPE,Adresse_(BAN)&Etiquette_DPE=F,G&Surface_habitable_logement_gte=${Math.max(50, surfaceMin / 10)}&sort=Date_établissement_DPE:-1`;

      const response = await fetch(apiUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Kilowater-Prospection/1.0 (contact@kilowater.fr)",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) continue;

      const data = await response.json() as {
        results?: Array<{
          "N°DPE"?: string;
          "Etiquette_DPE"?: string;
          "Nom__commune_(BAN)"?: string;
          "Code_postal_(BAN)"?: string;
          "Surface_habitable_logement"?: number;
          "Date_établissement_DPE"?: string;
          "Adresse_(BAN)"?: string;
        }>;
      };

      if (!data.results) continue;

      for (const dpe of data.results) {
        if (leads.length >= maxResults) break;
        const addr = dpe["Adresse_(BAN)"];
        if (!addr) continue;
        const ville = dpe["Nom__commune_(BAN)"] || getCityForDept(dept);
        const surface = dpe["Surface_habitable_logement"] || 0;
        const etiquette = (dpe["Etiquette_DPE"] || "F") as "F" | "G";

        leads.push({
          nom: addr,
          email: "", // Donnée anonymisée côté ADEME — propriétaire non identifié.
          roleCible: "Responsable patrimoine",
          type: "PROFESSIONNEL",
          source: "DPE_ADEME",
          sourceUrl: "https://observatoire-dpe-audit.ademe.fr",
          adresse: addr,
          ville,
          codePostal: dpe["Code_postal_(BAN)"] || undefined,
          departement: dept,
          surfaceBatiment: Math.round(surface),
          dpeEtiquette: etiquette,
          score: 0,
          notes:
            `[DPE ADEME] Étiquette ${etiquette} · ${Math.round(surface)} m² · ${ville}` +
            ` · DPE du ${dpe["Date_établissement_DPE"] || "N/A"} — Propriétaire à identifier ` +
            `(cadastre + annuaire copro / SIRENE).`,
        });
      }
    } catch {
      continue;
    }
  }

  return leads;
}
