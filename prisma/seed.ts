import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding de la base de données...");

  // ─── Leads de démonstration ─────────────────────────────────────
  const leadsData = [
    {
      nom: "Marie Dupont",
      email: "marie.dupont@email.fr",
      telephone: "06 12 34 56 78",
      type: "PARTICULIER" as const,
      source: "SITE_WEB" as const,
      statut: "NOUVEAU" as const,
      budgetEstime: 15000,
    },
    {
      nom: "SCI Les Oliviers",
      email: "contact@sci-oliviers.fr",
      telephone: "04 91 00 00 00",
      entreprise: "SCI Les Oliviers",
      type: "PROFESSIONNEL" as const,
      source: "RECOMMANDATION" as const,
      statut: "CONTACTE" as const,
      budgetEstime: 85000,
    },
    {
      nom: "Mairie de Salon-de-Provence",
      email: "urbanisme@salon.fr",
      telephone: "04 90 00 00 00",
      type: "COLLECTIVITE" as const,
      source: "DEMARCHAGE" as const,
      statut: "QUALIFIE" as const,
      budgetEstime: 250000,
    },
    {
      nom: "Jean-Pierre Martin",
      email: "jp.martin@gmail.com",
      telephone: "06 98 76 54 32",
      type: "PARTICULIER" as const,
      source: "SITE_WEB" as const,
      statut: "PROPOSITION" as const,
      budgetEstime: 22000,
    },
    {
      nom: "Résidence Le Parc",
      email: "syndic@leparc.fr",
      telephone: "04 42 00 00 00",
      entreprise: "Syndic Le Parc",
      type: "PROFESSIONNEL" as const,
      source: "RESEAU" as const,
      statut: "GAGNE" as const,
      budgetEstime: 120000,
    },
    {
      nom: "Pierre Lefèvre",
      email: "p.lefevre@orange.fr",
      type: "PARTICULIER" as const,
      source: "SITE_WEB" as const,
      statut: "PERDU" as const,
      budgetEstime: 8000,
      notes: "Budget insuffisant pour le scope demandé",
    },
  ];

  for (const lead of leadsData) {
    await prisma.lead.create({ data: lead });
  }

  console.log(`✓ ${leadsData.length} leads créés`);

  // ─── Client de démonstration ────────────────────────────────────
  const client = await prisma.client.create({
    data: {
      nom: "SCI Les Oliviers",
      email: "contact@sci-oliviers.fr",
      telephone: "04 91 00 00 00",
      type: "PROFESSIONNEL",
    },
  });

  console.log("✓ 1 client créé");

  // ─── Projet de démonstration ────────────────────────────────────
  await prisma.projet.create({
    data: {
      titre: "Rénovation énergétique — Bâtiment A",
      description: "Isolation thermique par l'extérieur et remplacement des menuiseries",
      statut: "EN_COURS",
      typeClient: "PROFESSIONNEL",
      budgetPrevu: 85000,
      budgetDepense: 32000,
      dateDebut: new Date("2026-03-01"),
      clientId: client.id,
      jalons: {
        create: [
          { titre: "Audit énergétique", echeance: new Date("2026-03-15"), fait: true },
          { titre: "Dépôt permis", echeance: new Date("2026-04-01"), fait: true },
          { titre: "Début travaux ITE", echeance: new Date("2026-05-01"), fait: false },
          { titre: "Réception", echeance: new Date("2026-07-15"), fait: false },
        ],
      },
    },
  });

  console.log("✓ 1 projet avec 4 jalons créé");

  console.log("\nSeed terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
