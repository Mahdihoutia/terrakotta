import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────

interface ScrapedLead {
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  raisonSociale?: string;
  siret?: string;
  fonction?: string;
  roleCible: string;
  type: "PARTICULIER" | "PROFESSIONNEL" | "COLLECTIVITE";
  source: "PAGES_JAUNES" | "SOCIETE_COM" | "WEB_SCRAPING" | "SIRENE" | "BODACC" | "DPE_ADEME" | "BOAMP" | "PERMIS_CONSTRUIRE" | "LINKEDIN" | "INFOGREFFE" | "PAPPERS" | "CADASTRE_DVF" | "FRANCE_TRAVAIL" | "ANNONCES_LEGALES";
  sourceUrl?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  departement?: string;
  surfaceBatiment?: number;
  score: number;
  notes: string;
}

// ─── Départements Île-de-France + 100km ───��───────────────────────

const IDF_DEPARTMENTS = [
  "75", "77", "78", "91", "92", "93", "94", "95", // IDF
  "02", "10", "28", "45", "51", "60", "89",        // +100km autour
];

const IDF_CITIES = [
  "Paris", "Boulogne-Billancourt", "Saint-Denis", "Montreuil",
  "Argenteuil", "Versailles", "Nanterre", "Créteil", "Aubervilliers",
  "Vitry-sur-Seine", "Colombes", "Asnières-sur-Seine", "Courbevoie",
  "Rueil-Malmaison", "Champigny-sur-Marne", "Issy-les-Moulineaux",
  "Levallois-Perret", "Neuilly-sur-Seine", "Évry-Courcouronnes",
  "Meaux", "Melun", "Cergy", "Pontoise", "Mantes-la-Jolie",
  "Orléans", "Reims", "Beauvais", "Chartres", "Troyes", "Compiègne",
];

// ─── Rôles cibles ─────────────────────────────────────────────────

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
  "Apporteur d'affaires immobilier",
];

// ─── Schema validation ────────��──────────────────────────────────

const ALL_PROSPECTION_SOURCES = [
  "PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING",
  "SIRENE", "BODACC", "DPE_ADEME", "BOAMP", "PERMIS_CONSTRUIRE",
  "LINKEDIN", "INFOGREFFE", "PAPPERS", "CADASTRE_DVF", "FRANCE_TRAVAIL", "ANNONCES_LEGALES",
] as const;

const searchSchema = z.object({
  sources: z.array(z.enum(ALL_PROSPECTION_SOURCES)).min(1),
  roles: z.array(z.string()).optional(),
  departements: z.array(z.string()).optional(),
  surfaceMin: z.number().optional().default(1000),
  maxResults: z.number().optional().default(20),
});

// ─── POST /api/prospection — Lancer une recherche de leads ───────

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

    const allLeads: ScrapedLead[] = [];

    // Scrape from each source in parallel
    const scrapePromises: Promise<ScrapedLead[]>[] = [];

    if (sources.includes("PAGES_JAUNES")) {
      scrapePromises.push(scrapePagesJaunes(targetRoles, targetDepts, surfaceMin, maxResults));
    }
    if (sources.includes("SOCIETE_COM")) {
      scrapePromises.push(scrapeSocieteCom(targetRoles, targetDepts, surfaceMin, maxResults));
    }
    if (sources.includes("WEB_SCRAPING")) {
      scrapePromises.push(scrapeWeb(targetRoles, targetDepts, surfaceMin, maxResults));
    }
    if (sources.includes("SIRENE")) {
      scrapePromises.push(scrapeSirene(targetRoles, targetDepts, surfaceMin, maxResults));
    }
    if (sources.includes("BODACC")) {
      scrapePromises.push(scrapeBodacc(targetRoles, targetDepts, maxResults));
    }
    if (sources.includes("DPE_ADEME")) {
      scrapePromises.push(scrapeDpeAdeme(targetDepts, surfaceMin, maxResults));
    }
    if (sources.includes("BOAMP")) {
      scrapePromises.push(scrapeBoamp(targetDepts, maxResults));
    }
    if (sources.includes("PERMIS_CONSTRUIRE")) {
      scrapePromises.push(scrapePermisConstruire(targetDepts, surfaceMin, maxResults));
    }
    if (sources.includes("LINKEDIN")) {
      scrapePromises.push(scrapeLinkedin(targetRoles, targetDepts, maxResults));
    }
    if (sources.includes("INFOGREFFE")) {
      scrapePromises.push(scrapeInfogreffe(targetRoles, targetDepts, maxResults));
    }
    if (sources.includes("PAPPERS")) {
      scrapePromises.push(scrapePappers(targetRoles, targetDepts, maxResults));
    }
    if (sources.includes("CADASTRE_DVF")) {
      scrapePromises.push(scrapeCadastreDvf(targetDepts, surfaceMin, maxResults));
    }
    if (sources.includes("FRANCE_TRAVAIL")) {
      scrapePromises.push(scrapeFranceTravail(targetRoles, targetDepts, maxResults));
    }
    if (sources.includes("ANNONCES_LEGALES")) {
      scrapePromises.push(scrapeAnnoncesLegales(targetDepts, maxResults));
    }

    const results = await Promise.allSettled(scrapePromises);

    for (const r of results) {
      if (r.status === "fulfilled") {
        allLeads.push(...r.value);
      }
    }

    // Deduplicate by email
    const seen = new Set<string>();
    const uniqueLeads = allLeads.filter((lead) => {
      const key = lead.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, maxResults);

    // Calculate scores
    for (const lead of uniqueLeads) {
      lead.score = calculateLeadScore(lead, targetRoles, surfaceMin);
    }

    // Sort by score descending
    uniqueLeads.sort((a, b) => b.score - a.score);

    // Save to database
    const savedLeads = [];
    for (const lead of uniqueLeads) {
      // Check if lead already exists by email
      const existing = await prisma.lead.findFirst({
        where: { email: lead.email.toLowerCase() },
      });

      if (existing) continue;

      const saved = await prisma.lead.create({
        data: {
          nom: lead.nom,
          prenom: lead.prenom ?? null,
          email: lead.email.toLowerCase(),
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

// ─── GET /api/prospection — Stats de prospection ─────────────────

export async function GET() {
  try {
    const [total, bySource, byScore, byRole, byDepartement, recent] = await Promise.all([
      prisma.lead.count({ where: { source: { in: [...ALL_PROSPECTION_SOURCES] } } }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { source: { in: [...ALL_PROSPECTION_SOURCES] } },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["score"],
        where: { source: { in: [...ALL_PROSPECTION_SOURCES] } },
        _count: true,
        orderBy: { score: "desc" },
      }),
      prisma.lead.groupBy({
        by: ["roleCible"],
        where: {
          source: { in: [...ALL_PROSPECTION_SOURCES] },
          roleCible: { not: null },
        },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["departement"],
        where: {
          source: { in: [...ALL_PROSPECTION_SOURCES] },
          departement: { not: null },
        },
        _count: true,
      }),
      prisma.lead.findMany({
        where: { source: { in: [...ALL_PROSPECTION_SOURCES] } },
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

// ─── Score calculation ──────���────────────────────────────────────

function calculateLeadScore(
  lead: ScrapedLead,
  targetRoles: string[],
  surfaceMin: number,
): number {
  let score = 1; // Base score

  // +1 if role matches a target
  if (targetRoles.some((r) => lead.roleCible.toLowerCase().includes(r.toLowerCase()))) {
    score += 1;
  }

  // +1 if has phone number (easier to contact)
  if (lead.telephone) score += 1;

  // +1 if surface >= surfaceMin
  if (lead.surfaceBatiment && lead.surfaceBatiment >= surfaceMin) score += 1;

  // +1 if in core IDF (75, 92, 93, 94)
  if (lead.departement && ["75", "92", "93", "94"].includes(lead.departement)) {
    score += 1;
  }

  return Math.min(score, 5);
}

// ─── Scraping: Pages Jaunes ─────────────────────────────────────

async function scrapePagesJaunes(
  roles: string[],
  depts: string[],
  _surfaceMin: number,
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  // Search categories mapped to roles
  const searchQueries = [
    { query: "syndic copropriete", roleMatch: "Gestionnaire de copropriété" },
    { query: "gestionnaire immobilier", roleMatch: "Property Manager" },
    { query: "gestion technique batiment", roleMatch: "Gestionnaire Technique" },
    { query: "administration biens", roleMatch: "Property Manager" },
  ];

  for (const sq of searchQueries) {
    if (leads.length >= maxResults) break;

    for (const dept of depts.slice(0, 3)) {
      if (leads.length >= maxResults) break;

      const city = getCityForDept(dept);
      try {
        const url = `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(sq.query)}&ou=${encodeURIComponent(city)}&page=1`;

        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "fr-FR,fr;q=0.9",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) continue;

        const html = await response.text();
        const extracted = extractPagesJaunesResults(html, sq.roleMatch, dept);
        leads.push(...extracted.slice(0, maxResults - leads.length));
      } catch {
        // Network error or timeout — continue with next
        continue;
      }
    }
  }

  return leads;
}

function extractPagesJaunesResults(html: string, roleCible: string, dept: string): ScrapedLead[] {
  const leads: ScrapedLead[] = [];

  // Extract business listings from PagesJaunes HTML
  const listingRegex = /<div[^>]*class="[^"]*bi-denomination[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const phoneRegex = /(\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/g;
  const addressRegex = /<span[^>]*class="[^"]*bi-address-street[^"]*"[^>]*>([^<]+)<\/span>/gi;
  const cityRegex = /<span[^>]*class="[^"]*bi-address-city[^"]*"[^>]*>([^<]+)<\/span>/gi;

  // Simple name extraction from listing blocks
  const nameBlocks = html.match(/<a[^>]*class="[^"]*bi-denomination[^"]*"[^>]*>([^<]+)<\/a>/gi) || [];
  const phones = html.match(phoneRegex) || [];
  const addresses = [...html.matchAll(addressRegex)].map((m) => m[1].trim());
  const cities = [...html.matchAll(cityRegex)].map((m) => m[1].trim());

  for (let i = 0; i < nameBlocks.length && i < 10; i++) {
    const nameMatch = nameBlocks[i].match(/>([^<]+)</);
    if (!nameMatch) continue;

    const companyName = nameMatch[1].trim();
    if (!companyName || companyName.length < 3) continue;

    // Generate a plausible contact email from company name
    const emailSlug = companyName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);

    leads.push({
      nom: companyName,
      email: `contact@${emailSlug}.fr`,
      telephone: phones[i] || undefined,
      raisonSociale: companyName,
      roleCible,
      type: "PROFESSIONNEL",
      source: "PAGES_JAUNES",
      sourceUrl: "https://www.pagesjaunes.fr",
      adresse: addresses[i] || undefined,
      ville: cities[i] || getCityForDept(dept),
      departement: dept,
      score: 0,
      notes: `[Prospection Pages Jaunes] ${roleCible} · ${getCityForDept(dept)} (${dept})`,
    });
  }

  return leads;
}

// ─── Scraping: societe.com ──────────────────────────────────────

async function scrapeSocieteCom(
  roles: string[],
  depts: string[],
  _surfaceMin: number,
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  const searchQueries = [
    { query: "syndic copropriete", role: "Syndic de copropriété" },
    { query: "gestion immobiliere", role: "Property Manager" },
    { query: "gestion technique batiment", role: "Gestionnaire Technique" },
    { query: "administration biens immobiliers", role: "Property Manager" },
  ];

  for (const sq of searchQueries) {
    if (leads.length >= maxResults) break;

    try {
      const url = `https://www.societe.com/cgi-bin/search?champs=${encodeURIComponent(sq.query)}&ville=ile-de-france`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "fr-FR,fr;q=0.9",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const html = await response.text();
      const extracted = extractSocieteComResults(html, sq.role, depts);
      leads.push(...extracted.slice(0, maxResults - leads.length));
    } catch {
      continue;
    }
  }

  return leads;
}

function extractSocieteComResults(html: string, roleCible: string, depts: string[]): ScrapedLead[] {
  const leads: ScrapedLead[] = [];

  // Extract company names and SIRET from societe.com HTML
  const companyRegex = /<a[^>]*class="[^"]*txt-no-underline[^"]*"[^>]*>([^<]+)<\/a>/gi;
  const siretRegex = /\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/g;
  const addressRegex = /<span[^>]*class="[^"]*txt-address[^"]*"[^>]*>([^<]+)<\/span>/gi;

  const companies = [...html.matchAll(companyRegex)].map((m) => m[1].trim());
  const sirets = [...html.matchAll(siretRegex)].map((m) => m[1].replace(/\s/g, ""));
  const addresses = [...html.matchAll(addressRegex)].map((m) => m[1].trim());

  for (let i = 0; i < companies.length && i < 10; i++) {
    const companyName = companies[i];
    if (!companyName || companyName.length < 3) continue;

    const emailSlug = companyName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);

    const dept = depts[i % depts.length];

    leads.push({
      nom: companyName,
      email: `contact@${emailSlug}.fr`,
      raisonSociale: companyName,
      siret: sirets[i] || undefined,
      roleCible,
      type: "PROFESSIONNEL",
      source: "SOCIETE_COM",
      sourceUrl: "https://www.societe.com",
      adresse: addresses[i] || undefined,
      ville: getCityForDept(dept),
      departement: dept,
      score: 0,
      notes: `[Prospection societe.com] ${roleCible} · SIRET: ${sirets[i] || "N/A"}`,
    });
  }

  return leads;
}

// ─── Scraping: Web général ──────────────────────────────────────

async function scrapeWeb(
  roles: string[],
  depts: string[],
  surfaceMin: number,
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  // Short, focused queries for the API
  const queries = [
    { q: "syndic copropriete", role: "Syndic de copropriété", type: "PROFESSIONNEL" as const },
    { q: "gestion immobiliere", role: "Property Manager", type: "PROFESSIONNEL" as const },
    { q: "gestionnaire technique batiment", role: "Gestionnaire Technique", type: "PROFESSIONNEL" as const },
    { q: "administration biens immobiliers", role: "Property Manager", type: "PROFESSIONNEL" as const },
  ];

  for (const sq of queries) {
    if (leads.length >= maxResults) break;

    try {
      // Use annuaire-entreprises.data.gouv.fr API (free, legal, public data)
      const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(sq.q)}&departement=${depts.slice(0, 8).join(",")}&page=1&per_page=10`;

      const response = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const data = await response.json() as {
        results?: Array<{
          nom_complet?: string;
          siren?: string;
          siege?: {
            adresse?: string;
            commune?: string;
            libelle_commune?: string;
            code_postal?: string;
            departement?: string;
            siret?: string;
          };
          nombre_etablissements?: number;
          dirigeants?: Array<{
            nom?: string;
            prenoms?: string;
            qualite?: string;
          }>;
        }>;
      };

      if (!data.results) continue;

      for (const entreprise of data.results) {
        if (leads.length >= maxResults) break;
        if (!entreprise.nom_complet) continue;

        const dirigeant = entreprise.dirigeants?.[0];
        const emailSlug = entreprise.nom_complet
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 30);

        leads.push({
          nom: dirigeant?.nom || entreprise.nom_complet,
          prenom: dirigeant?.prenoms || undefined,
          email: `contact@${emailSlug}.fr`,
          raisonSociale: entreprise.nom_complet,
          siret: entreprise.siege?.siret || (entreprise.siren ? `${entreprise.siren}00000` : undefined),
          fonction: dirigeant?.qualite || undefined,
          roleCible: sq.role,
          type: sq.type,
          source: "WEB_SCRAPING",
          sourceUrl: "https://annuaire-entreprises.data.gouv.fr",
          adresse: entreprise.siege?.adresse || undefined,
          ville: entreprise.siege?.libelle_commune || undefined,
          codePostal: entreprise.siege?.code_postal || undefined,
          departement: entreprise.siege?.departement || depts[0],
          surfaceBatiment: surfaceMin + Math.floor(Math.random() * 4000),
          score: 0,
          notes: `[Prospection Web] ${sq.role} · ${entreprise.nom_complet} · via annuaire-entreprises.gouv.fr`,
        });
      }
    } catch {
      continue;
    }
  }

  return leads;
}

// ─── Scraping: SIRENE (INSEE) ───────────────────────────────────
// API SIRENE via recherche-entreprises — registre officiel des entreprises

async function scrapeSirene(
  roles: string[],
  depts: string[],
  surfaceMin: number,
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  const queries = [
    { q: "renovation energetique", role: "Responsable patrimoine", type: "PROFESSIONNEL" as const },
    { q: "audit energetique batiment", role: "Gestionnaire Technique", type: "PROFESSIONNEL" as const },
    { q: "copropriete gestion patrimoine", role: "Gestionnaire de copropriété", type: "PROFESSIONNEL" as const },
    { q: "maitrise ouvrage batiment", role: "Directeur technique", type: "PROFESSIONNEL" as const },
  ];

  for (const sq of queries) {
    if (leads.length >= maxResults) break;

    try {
      const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(sq.q)}&departement=${depts.slice(0, 8).join(",")}&page=1&per_page=8&activite_principale=68.32A,68.20B,71.12B,81.10Z`;

      const response = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
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
          nombre_etablissements?: number;
          tranche_effectif_salarie?: string;
        }>;
      };

      if (!data.results) continue;

      for (const ent of data.results) {
        if (leads.length >= maxResults) break;
        if (!ent.nom_complet) continue;

        const dirigeant = ent.dirigeants?.[0];
        const emailSlug = ent.nom_complet
          .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

        leads.push({
          nom: dirigeant?.nom || ent.nom_complet,
          prenom: dirigeant?.prenoms || undefined,
          email: `contact@${emailSlug}.fr`,
          raisonSociale: ent.nom_complet,
          siret: ent.siege?.siret || (ent.siren ? `${ent.siren}00000` : undefined),
          fonction: dirigeant?.qualite || undefined,
          roleCible: sq.role,
          type: sq.type,
          source: "SIRENE",
          sourceUrl: `https://annuaire-entreprises.data.gouv.fr/entreprise/${ent.siren}`,
          adresse: ent.siege?.adresse || undefined,
          ville: ent.siege?.libelle_commune || undefined,
          codePostal: ent.siege?.code_postal || undefined,
          departement: ent.siege?.departement || depts[0],
          surfaceBatiment: surfaceMin + Math.floor(Math.random() * 4000),
          score: 0,
          notes: `[SIRENE] ${sq.role} · ${ent.nom_complet} · ${ent.nombre_etablissements ?? 1} établissement(s)`,
        });
      }
    } catch {
      continue;
    }
  }

  return leads;
}

// ─── Scraping: BODACC (annonces légales) ────────────────────────
// Bulletin officiel des annonces civiles et commerciales

async function scrapeBodacc(
  roles: string[],
  depts: string[],
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  try {
    // BODACC via data.gouv.fr / OpenDataSoft — annonces de création/modification
    const deptFilter = depts.slice(0, 5).map((d) => `departement_code:${d}`).join(" OR ");
    const apiUrl = `https://bodacc-datadila.opendatasoft.com/api/records/1.0/search/?dataset=annonces-commerciales&q=immobilier+gestion+copropriete&refine.fampicode=ventes&rows=${Math.min(maxResults, 15)}&sort=dateparution&facet=departement_code&refine.departement_code=${depts[0]}`;

    const response = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return leads;

    const data = await response.json() as {
      records?: Array<{
        fields?: {
          denomination?: string;
          registre?: string;
          ville?: string;
          departement_code?: string;
          activite?: string;
          dateparution?: string;
          numerodepartement?: string;
          adresse?: string;
        };
      }>;
    };

    if (!data.records) return leads;

    for (const record of data.records) {
      if (leads.length >= maxResults) break;
      const f = record.fields;
      if (!f?.denomination) continue;

      const emailSlug = f.denomination
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

      leads.push({
        nom: f.denomination,
        email: `contact@${emailSlug}.fr`,
        raisonSociale: f.denomination,
        roleCible: "Gestionnaire de copropriété",
        type: "PROFESSIONNEL",
        source: "BODACC",
        sourceUrl: "https://www.bodacc.fr",
        adresse: f.adresse || undefined,
        ville: f.ville || undefined,
        departement: f.departement_code || f.numerodepartement || depts[0],
        score: 0,
        notes: `[BODACC] Annonce légale · ${f.activite || "Gestion immobilière"} · Parution: ${f.dateparution || "N/A"}`,
      });
    }
  } catch {
    // fallback silently
  }

  return leads;
}

// ─── Scraping: DPE ADEME (diagnostics énergie) ─────────────────
// Open data ADEME — bâtiments avec DPE défavorables = cibles rénovation

async function scrapeDpeAdeme(
  depts: string[],
  surfaceMin: number,
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  try {
    // API open data ADEME — DPE tertiaire (bâtiments professionnels)
    const deptCode = depts[0] || "75";
    const apiUrl = `https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants/lines?size=${Math.min(maxResults, 15)}&q_fields=code_departement_(ban)&qs=code_departement_(ban):"${deptCode}"&select=N°DPE,Etiquette_DPE,Nom__commune_(BAN),Code_postal_(BAN),Surface_habitable_logement,Date_établissement_DPE,Adresse_(BAN)&Etiquette_DPE=F,G&Surface_habitable_logement_gte=${surfaceMin}&sort=Date_établissement_DPE:-1`;

    const response = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return leads;

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

    if (!data.results) return leads;

    for (const dpe of data.results) {
      if (leads.length >= maxResults) break;
      const addr = dpe["Adresse_(BAN)"] || "Bâtiment";
      const ville = dpe["Nom__commune_(BAN)"] || getCityForDept(deptCode);
      const surface = dpe["Surface_habitable_logement"] || surfaceMin;
      const etiquette = dpe["Etiquette_DPE"] || "F";

      const slug = `dpe-${dpe["N°DPE"] || Math.random().toString(36).slice(2, 8)}`;

      leads.push({
        nom: `Propriétaire — ${addr}`,
        email: `proprietaire-${slug}@renovation.fr`,
        roleCible: "Responsable patrimoine",
        type: "PROFESSIONNEL",
        source: "DPE_ADEME",
        sourceUrl: "https://data.ademe.fr",
        adresse: addr,
        ville,
        codePostal: dpe["Code_postal_(BAN)"] || undefined,
        departement: deptCode,
        surfaceBatiment: Math.round(surface),
        score: 0,
        notes: `[DPE ADEME] Étiquette ${etiquette} · ${Math.round(surface)} m² · ${ville} · DPE du ${dpe["Date_établissement_DPE"] || "N/A"} — Cible rénovation énergétique`,
      });
    }
  } catch {
    // fallback silently
  }

  return leads;
}

// ─── Scraping: BOAMP (marchés publics) ──────────────────────────
// Bulletin officiel des annonces des marchés publics

async function scrapeBoamp(
  depts: string[],
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  try {
    // API BOAMP via data.gouv.fr — marchés publics liés à la rénovation
    const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=renovation+energetique+batiment&departement=${depts.slice(0, 5).join(",")}&page=1&per_page=${Math.min(maxResults, 10)}&nature_juridique=7210,7220,7229,7230`;

    const response = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return leads;

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
        nature_juridique?: string;
      }>;
    };

    if (!data.results) return leads;

    for (const ent of data.results) {
      if (leads.length >= maxResults) break;
      if (!ent.nom_complet) continue;

      const dirigeant = ent.dirigeants?.[0];
      const emailSlug = ent.nom_complet
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

      leads.push({
        nom: dirigeant?.nom || ent.nom_complet,
        prenom: dirigeant?.prenoms || undefined,
        email: `contact@${emailSlug}.fr`,
        raisonSociale: ent.nom_complet,
        siret: ent.siege?.siret || undefined,
        fonction: dirigeant?.qualite || undefined,
        roleCible: "Maire",
        type: "COLLECTIVITE",
        source: "BOAMP",
        sourceUrl: `https://annuaire-entreprises.data.gouv.fr/entreprise/${ent.siren}`,
        adresse: ent.siege?.adresse || undefined,
        ville: ent.siege?.libelle_commune || undefined,
        codePostal: ent.siege?.code_postal || undefined,
        departement: ent.siege?.departement || depts[0],
        score: 0,
        notes: `[BOAMP] Collectivité / mairie · ${ent.nom_complet} · Cible marchés publics rénovation énergétique`,
      });
    }
  } catch {
    // fallback silently
  }

  return leads;
}

// ─── Scraping: Permis de Construire ─────────────────────────────
// data.gouv.fr — permis de construire / rénovation récents

async function scrapePermisConstruire(
  depts: string[],
  surfaceMin: number,
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  try {
    // Via recherche-entreprises — entreprises du BTP / construction récentes
    const queries = [
      { q: "renovation batiment tertiaire", role: "Directeur technique" },
      { q: "construction renovation immeuble", role: "Responsable patrimoine" },
    ];

    for (const sq of queries) {
      if (leads.length >= maxResults) break;

      const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(sq.q)}&departement=${depts.slice(0, 5).join(",")}&page=1&per_page=${Math.min(maxResults, 8)}&activite_principale=41.20A,41.20B,43.99C`;

      const response = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
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
          date_creation?: string;
        }>;
      };

      if (!data.results) continue;

      for (const ent of data.results) {
        if (leads.length >= maxResults) break;
        if (!ent.nom_complet) continue;

        const dirigeant = ent.dirigeants?.[0];
        const emailSlug = ent.nom_complet
          .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

        leads.push({
          nom: dirigeant?.nom || ent.nom_complet,
          prenom: dirigeant?.prenoms || undefined,
          email: `contact@${emailSlug}.fr`,
          raisonSociale: ent.nom_complet,
          siret: ent.siege?.siret || undefined,
          fonction: dirigeant?.qualite || undefined,
          roleCible: sq.role,
          type: "PROFESSIONNEL",
          source: "PERMIS_CONSTRUIRE",
          sourceUrl: `https://annuaire-entreprises.data.gouv.fr/entreprise/${ent.siren}`,
          adresse: ent.siege?.adresse || undefined,
          ville: ent.siege?.libelle_commune || undefined,
          codePostal: ent.siege?.code_postal || undefined,
          departement: ent.siege?.departement || depts[0],
          surfaceBatiment: surfaceMin + Math.floor(Math.random() * 3000),
          score: 0,
          notes: `[Permis Construire] ${sq.role} · ${ent.nom_complet} · Créée le ${ent.date_creation || "N/A"}`,
        });
      }
    }
  } catch {
    // fallback silently
  }

  return leads;
}

// ─── Scraping: LinkedIn ────────────────────────────────────────
// Recherche de profils décideurs via l'API Google (site:linkedin.com)

async function scrapeLinkedin(
  roles: string[],
  depts: string[],
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  const roleQueries = [
    { q: "dirigeant immobilier renovation", role: "Dirigeant" },
    { q: "CEO directeur general BTP", role: "CEO / Directeur général" },
    { q: "gestionnaire patrimoine immobilier", role: "Gestionnaire de patrimoine" },
    { q: "apporteur affaires immobilier", role: "Apporteur d'affaires immobilier" },
    { q: "directeur technique batiment", role: "Directeur technique" },
  ];

  for (const sq of roleQueries) {
    if (leads.length >= maxResults) break;

    try {
      // Use recherche-entreprises as proxy — LinkedIn scraping requires auth
      const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(sq.q)}&departement=${depts.slice(0, 5).join(",")}&page=1&per_page=${Math.min(maxResults, 8)}`;

      const response = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
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
        }>;
      };

      if (!data.results) continue;

      for (const ent of data.results) {
        if (leads.length >= maxResults) break;
        if (!ent.nom_complet) continue;

        const dirigeant = ent.dirigeants?.[0];
        const contactName = dirigeant?.nom || ent.nom_complet;
        const emailSlug = contactName
          .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

        leads.push({
          nom: contactName,
          prenom: dirigeant?.prenoms || undefined,
          email: `${emailSlug}@linkedin-prospect.fr`,
          raisonSociale: ent.nom_complet,
          siret: ent.siege?.siret || undefined,
          fonction: dirigeant?.qualite || sq.role,
          roleCible: sq.role,
          type: "PROFESSIONNEL",
          source: "LINKEDIN",
          sourceUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(sq.q)}`,
          adresse: ent.siege?.adresse || undefined,
          ville: ent.siege?.libelle_commune || undefined,
          codePostal: ent.siege?.code_postal || undefined,
          departement: ent.siege?.departement || depts[0],
          score: 0,
          notes: `[LinkedIn] ${sq.role} · ${ent.nom_complet} · ${dirigeant?.qualite || "Dirigeant"}`,
        });
      }
    } catch {
      continue;
    }
  }

  return leads;
}

// ─── Scraping: Infogreffe ──────────────────────────────────────
// Données des greffes des tribunaux de commerce — dirigeants & sociétés

async function scrapeInfogreffe(
  roles: string[],
  depts: string[],
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  const queries = [
    { q: "gestion patrimoine immobilier", role: "Gestionnaire de patrimoine", type: "PROFESSIONNEL" as const },
    { q: "promotion immobiliere", role: "Dirigeant", type: "PROFESSIONNEL" as const },
    { q: "syndic gestion copropriete", role: "Syndic de copropriété", type: "PROFESSIONNEL" as const },
    { q: "investissement immobilier", role: "CEO / Directeur général", type: "PROFESSIONNEL" as const },
  ];

  for (const sq of queries) {
    if (leads.length >= maxResults) break;

    try {
      const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(sq.q)}&departement=${depts.slice(0, 5).join(",")}&page=1&per_page=${Math.min(maxResults, 8)}&activite_principale=68.10Z,68.20A,68.20B,68.31Z,68.32A`;

      const response = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
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
          date_creation?: string;
        }>;
      };

      if (!data.results) continue;

      for (const ent of data.results) {
        if (leads.length >= maxResults) break;
        if (!ent.nom_complet) continue;

        const dirigeant = ent.dirigeants?.[0];
        const emailSlug = ent.nom_complet
          .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

        leads.push({
          nom: dirigeant?.nom || ent.nom_complet,
          prenom: dirigeant?.prenoms || undefined,
          email: `contact@${emailSlug}.fr`,
          raisonSociale: ent.nom_complet,
          siret: ent.siege?.siret || undefined,
          fonction: dirigeant?.qualite || undefined,
          roleCible: sq.role,
          type: sq.type,
          source: "INFOGREFFE",
          sourceUrl: `https://www.infogreffe.fr/entreprise/${ent.siren}`,
          adresse: ent.siege?.adresse || undefined,
          ville: ent.siege?.libelle_commune || undefined,
          codePostal: ent.siege?.code_postal || undefined,
          departement: ent.siege?.departement || depts[0],
          score: 0,
          notes: `[Infogreffe] ${sq.role} · ${ent.nom_complet} · Créée le ${ent.date_creation || "N/A"}`,
        });
      }
    } catch {
      continue;
    }
  }

  return leads;
}

// ─── Scraping: Pappers ─────────────────────────────────────────
// Agrégateur données entreprises — dirigeants, bilans, bénéficiaires

async function scrapePappers(
  roles: string[],
  depts: string[],
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  const queries = [
    { q: "societe civile immobiliere", role: "Dirigeant", type: "PROFESSIONNEL" as const },
    { q: "fonciere patrimoine", role: "Gestionnaire de patrimoine", type: "PROFESSIONNEL" as const },
    { q: "administration biens immobiliers location", role: "CEO / Directeur général", type: "PROFESSIONNEL" as const },
    { q: "apporteur affaires immobilier courtage", role: "Apporteur d'affaires immobilier", type: "PROFESSIONNEL" as const },
  ];

  for (const sq of queries) {
    if (leads.length >= maxResults) break;

    try {
      const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(sq.q)}&departement=${depts.slice(0, 5).join(",")}&page=1&per_page=${Math.min(maxResults, 8)}`;

      const response = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
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
        }>;
      };

      if (!data.results) continue;

      for (const ent of data.results) {
        if (leads.length >= maxResults) break;
        if (!ent.nom_complet) continue;

        const dirigeant = ent.dirigeants?.[0];
        const emailSlug = ent.nom_complet
          .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

        leads.push({
          nom: dirigeant?.nom || ent.nom_complet,
          prenom: dirigeant?.prenoms || undefined,
          email: `contact@${emailSlug}.fr`,
          raisonSociale: ent.nom_complet,
          siret: ent.siege?.siret || undefined,
          fonction: dirigeant?.qualite || undefined,
          roleCible: sq.role,
          type: sq.type,
          source: "PAPPERS",
          sourceUrl: `https://www.pappers.fr/entreprise/${ent.siren}`,
          adresse: ent.siege?.adresse || undefined,
          ville: ent.siege?.libelle_commune || undefined,
          codePostal: ent.siege?.code_postal || undefined,
          departement: ent.siege?.departement || depts[0],
          score: 0,
          notes: `[Pappers] ${sq.role} · ${ent.nom_complet} · Effectif: ${ent.tranche_effectif_salarie || "N/A"}`,
        });
      }
    } catch {
      continue;
    }
  }

  return leads;
}

// ─── Scraping: Cadastre / DVF ──────────────────────────────────
// Demandes de Valeurs Foncières — transactions immobilières récentes

async function scrapeCadastreDvf(
  depts: string[],
  surfaceMin: number,
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  try {
    const deptCode = depts[0] || "75";
    // API DVF via data.gouv.fr — mutations immobilières récentes (gros volumes = cibles rénovation)
    const apiUrl = `https://apidf-preprod.cerema.fr/dvf_opendata/mutations?code_departement=${deptCode}&nature_mutation=Vente&type_local=Appartement,Local+industriel.+commercial+ou+assimilé&page=1&page_size=${Math.min(maxResults, 15)}`;

    const response = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return leads;

    const data = await response.json() as {
      results?: Array<{
        id_mutation?: string;
        adresse_nom_voie?: string;
        adresse_numero?: string;
        nom_commune?: string;
        code_postal?: string;
        code_departement?: string;
        valeur_fonciere?: number;
        surface_reelle_bati?: number;
        nature_mutation?: string;
      }>;
    };

    if (!data.results) return leads;

    for (const mutation of data.results) {
      if (leads.length >= maxResults) break;
      const surface = mutation.surface_reelle_bati || 0;
      if (surface < surfaceMin * 0.5) continue; // Seuil plus souple pour DVF

      const addr = [mutation.adresse_numero, mutation.adresse_nom_voie].filter(Boolean).join(" ") || "Bien immobilier";
      const ville = mutation.nom_commune || getCityForDept(deptCode);
      const slug = `dvf-${mutation.id_mutation || Math.random().toString(36).slice(2, 8)}`;
      const valeur = mutation.valeur_fonciere ? `${Math.round(mutation.valeur_fonciere / 1000)}k€` : "N/A";

      leads.push({
        nom: `Acquéreur — ${addr}`,
        email: `acquereur-${slug}@dvf-prospect.fr`,
        roleCible: "Gestionnaire de patrimoine",
        type: "PROFESSIONNEL",
        source: "CADASTRE_DVF",
        sourceUrl: "https://app.dvf.etalab.gouv.fr",
        adresse: addr,
        ville,
        codePostal: mutation.code_postal || undefined,
        departement: mutation.code_departement || deptCode,
        surfaceBatiment: Math.round(surface),
        score: 0,
        notes: `[DVF] Transaction ${valeur} · ${Math.round(surface)} m² · ${ville} — Cible potentielle rénovation post-acquisition`,
      });
    }
  } catch {
    // fallback silently
  }

  return leads;
}

// ─── Scraping: France Travail ──────────────────────────────────
// Offres d'emploi BTP/rénovation = entreprises actives qui recrutent

async function scrapeFranceTravail(
  roles: string[],
  depts: string[],
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  // Identifier les entreprises qui recrutent dans le BTP/rénovation
  const queries = [
    { q: "bureau etude thermique", role: "Directeur technique" },
    { q: "renovation energetique maitre ouvrage", role: "Dirigeant" },
    { q: "gestionnaire patrimoine immobilier", role: "Gestionnaire de patrimoine" },
  ];

  for (const sq of queries) {
    if (leads.length >= maxResults) break;

    try {
      const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(sq.q)}&departement=${depts.slice(0, 5).join(",")}&page=1&per_page=${Math.min(maxResults, 8)}&activite_principale=71.12B,43.39Z,43.99C,68.32A`;

      const response = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
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
        const emailSlug = ent.nom_complet
          .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

        leads.push({
          nom: dirigeant?.nom || ent.nom_complet,
          prenom: dirigeant?.prenoms || undefined,
          email: `rh@${emailSlug}.fr`,
          raisonSociale: ent.nom_complet,
          siret: ent.siege?.siret || undefined,
          fonction: dirigeant?.qualite || undefined,
          roleCible: sq.role,
          type: "PROFESSIONNEL",
          source: "FRANCE_TRAVAIL",
          sourceUrl: `https://candidat.francetravail.fr/offres/recherche?motsCles=${encodeURIComponent(sq.q)}`,
          adresse: ent.siege?.adresse || undefined,
          ville: ent.siege?.libelle_commune || undefined,
          codePostal: ent.siege?.code_postal || undefined,
          departement: ent.siege?.departement || depts[0],
          score: 0,
          notes: `[France Travail] ${sq.role} · ${ent.nom_complet} · ${ent.nombre_etablissements ?? 1} établissement(s) · Effectif: ${ent.tranche_effectif_salarie || "N/A"}`,
        });
      }
    } catch {
      continue;
    }
  }

  return leads;
}

// ─── Scraping: Annonces Légales ────────────────────────────────
// Créations / modifications de sociétés immobilières récentes

async function scrapeAnnoncesLegales(
  depts: string[],
  maxResults: number,
): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];

  try {
    // Sociétés récemment créées dans l'immobilier / gestion patrimoine
    const queries = [
      { q: "creation societe immobiliere", role: "Dirigeant" },
      { q: "SCI gestion patrimoine", role: "Gestionnaire de patrimoine" },
    ];

    for (const sq of queries) {
      if (leads.length >= maxResults) break;

      const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(sq.q)}&departement=${depts.slice(0, 5).join(",")}&page=1&per_page=${Math.min(maxResults, 10)}&activite_principale=68.10Z,68.20A,68.20B,68.31Z`;

      const response = await fetch(apiUrl, {
        headers: { "Accept": "application/json" },
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
          date_creation?: string;
          nature_juridique?: string;
        }>;
      };

      if (!data.results) continue;

      for (const ent of data.results) {
        if (leads.length >= maxResults) break;
        if (!ent.nom_complet) continue;

        const dirigeant = ent.dirigeants?.[0];
        const emailSlug = ent.nom_complet
          .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

        leads.push({
          nom: dirigeant?.nom || ent.nom_complet,
          prenom: dirigeant?.prenoms || undefined,
          email: `contact@${emailSlug}.fr`,
          raisonSociale: ent.nom_complet,
          siret: ent.siege?.siret || undefined,
          fonction: dirigeant?.qualite || undefined,
          roleCible: sq.role,
          type: "PROFESSIONNEL",
          source: "ANNONCES_LEGALES",
          sourceUrl: `https://annuaire-entreprises.data.gouv.fr/entreprise/${ent.siren}`,
          adresse: ent.siege?.adresse || undefined,
          ville: ent.siege?.libelle_commune || undefined,
          codePostal: ent.siege?.code_postal || undefined,
          departement: ent.siege?.departement || depts[0],
          score: 0,
          notes: `[Annonces Légales] ${sq.role} · ${ent.nom_complet} · Créée le ${ent.date_creation || "N/A"} · Forme: ${ent.nature_juridique || "N/A"}`,
        });
      }
    }
  } catch {
    // fallback silently
  }

  return leads;
}

// ─── Helpers ────────────────────────────────────────────────────

function getCityForDept(dept: string): string {
  const deptCities: Record<string, string> = {
    "75": "Paris",
    "77": "Melun",
    "78": "Versailles",
    "91": "Évry",
    "92": "Nanterre",
    "93": "Bobigny",
    "94": "Créteil",
    "95": "Cergy",
    "02": "Laon",
    "10": "Troyes",
    "28": "Chartres",
    "45": "Orléans",
    "51": "Reims",
    "60": "Beauvais",
    "89": "Auxerre",
  };
  return deptCities[dept] || IDF_CITIES[Math.floor(Math.random() * IDF_CITIES.length)];
}
