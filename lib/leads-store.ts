import type { Lead, LeadStatus, LeadSource, ClientType } from "@/types";

const INITIAL_LEADS: Lead[] = [
  {
    id: "1",
    nom: "Marie Dupont",
    email: "marie.dupont@email.fr",
    telephone: "06 12 34 56 78",
    type: "PARTICULIER",
    source: "SITE_WEB",
    statut: "NOUVEAU",
    budgetEstime: 15000,
    dateCreation: "2026-03-30",
    dateMiseAJour: "2026-03-30",
  },
  {
    id: "2",
    nom: "SCI Les Oliviers",
    email: "contact@sci-oliviers.fr",
    telephone: "04 91 00 00 00",
    raisonSociale: "SCI Les Oliviers",
    type: "PROFESSIONNEL",
    source: "RECOMMANDATION",
    statut: "CONTACTE",
    budgetEstime: 85000,
    dateCreation: "2026-03-28",
    dateMiseAJour: "2026-03-29",
  },
  {
    id: "3",
    nom: "Mairie de Salon-de-Provence",
    email: "urbanisme@salon.fr",
    telephone: "04 90 00 00 00",
    type: "COLLECTIVITE",
    source: "DEMARCHAGE",
    statut: "QUALIFIE",
    budgetEstime: 250000,
    dateCreation: "2026-03-20",
    dateMiseAJour: "2026-03-28",
  },
  {
    id: "4",
    nom: "Jean-Pierre Martin",
    email: "jp.martin@gmail.com",
    telephone: "06 98 76 54 32",
    type: "PARTICULIER",
    source: "SITE_WEB",
    statut: "PROPOSITION",
    budgetEstime: 22000,
    dateCreation: "2026-03-15",
    dateMiseAJour: "2026-03-27",
  },
  {
    id: "5",
    nom: "Résidence Le Parc",
    email: "syndic@leparc.fr",
    telephone: "04 42 00 00 00",
    raisonSociale: "Syndic Le Parc",
    type: "PROFESSIONNEL",
    source: "RESEAU",
    statut: "GAGNE",
    budgetEstime: 120000,
    dateCreation: "2026-02-10",
    dateMiseAJour: "2026-03-25",
  },
  {
    id: "6",
    nom: "Pierre Lefèvre",
    email: "p.lefevre@orange.fr",
    type: "PARTICULIER",
    source: "SITE_WEB",
    statut: "PERDU",
    budgetEstime: 8000,
    dateCreation: "2026-02-05",
    dateMiseAJour: "2026-03-20",
    notes: "Budget insuffisant pour le scope demandé",
  },
];

/** Simple in-memory store with React state sync via useSyncExternalStore pattern */
let leads: Lead[] = [...INITIAL_LEADS];
let listeners: Array<() => void> = [];

function emitChange() {
  listeners.forEach((l) => l());
}

export const leadsStore = {
  getAll(): Lead[] {
    return leads;
  },

  getById(id: string): Lead | undefined {
    return leads.find((l) => l.id === id);
  },

  add(lead: Omit<Lead, "id" | "dateCreation" | "dateMiseAJour">): Lead {
    const now = new Date().toISOString().split("T")[0];
    const newLead: Lead = {
      ...lead,
      id: crypto.randomUUID(),
      dateCreation: now,
      dateMiseAJour: now,
    };
    leads = [newLead, ...leads];
    emitChange();
    return newLead;
  },

  update(id: string, data: Partial<Lead>): Lead | undefined {
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    const now = new Date().toISOString().split("T")[0];
    leads = leads.map((l) =>
      l.id === id ? { ...l, ...data, dateMiseAJour: now } : l
    );
    emitChange();
    return leads.find((l) => l.id === id);
  },

  delete(id: string): boolean {
    const len = leads.length;
    leads = leads.filter((l) => l.id !== id);
    if (leads.length !== len) {
      emitChange();
      return true;
    }
    return false;
  },

  subscribe(listener: () => void): () => void {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  getSnapshot(): Lead[] {
    return leads;
  },
};

export type { Lead, LeadStatus, LeadSource, ClientType };
