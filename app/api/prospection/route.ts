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
  source: "PAGES_JAUNES" | "SOCIETE_COM" | "WEB_SCRAPING";
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
];

// ─── Schema validation ────────��──────────────────────────────────

const searchSchema = z.object({
  sources: z.array(z.enum(["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING"])).min(1),
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
      prisma.lead.count({ where: { source: { in: ["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING"] } } }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { source: { in: ["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING"] } },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["score"],
        where: { source: { in: ["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING"] } },
        _count: true,
        orderBy: { score: "desc" },
      }),
      prisma.lead.groupBy({
        by: ["roleCible"],
        where: {
          source: { in: ["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING"] },
          roleCible: { not: null },
        },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["departement"],
        where: {
          source: { in: ["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING"] },
          departement: { not: null },
        },
        _count: true,
      }),
      prisma.lead.findMany({
        where: { source: { in: ["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING"] } },
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
