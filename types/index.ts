export type LeadStatus = "NOUVEAU" | "CONTACTE" | "QUALIFIE" | "PROPOSITION" | "GAGNE" | "PERDU"

export type LeadSource = "SITE_WEB" | "RECOMMANDATION" | "RESEAU" | "DEMARCHAGE" | "AUTRE"

export type ClientType = "PARTICULIER" | "PROFESSIONNEL" | "COLLECTIVITE"

export type DevisStatut = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE"

export type ProjetStatut = "EN_ATTENTE" | "EN_COURS" | "EN_PAUSE" | "TERMINE" | "ANNULE"

export interface LigneDevis {
  id?: string
  designation: string
  unite: string
  quantite: number
  prixUnitHT: number
  tauxTVA: number
  ordre: number
}

export interface DevisClient {
  id: string
  nom: string
  prenom: string | null
  type: string
}

export interface DevisClientDetail extends DevisClient {
  email: string | null
  telephone: string | null
}

export interface DevisProjet {
  id: string
  titre: string
  statut: string
}

export interface Devis {
  id: string
  numero: string
  objet: string | null
  statut: DevisStatut
  montantHT: number
  tauxTVA: number
  montantTTC: number
  dateEmis: string
  dateValide: string | null
  clientId: string
  client: DevisClient
  projetId: string | null
  projet: DevisProjet | null
  lignesCount: number
  createdAt: string
  updatedAt: string
}

export interface DevisDetail extends Omit<Devis, "client" | "lignesCount"> {
  client: DevisClientDetail
  lignes: LigneDevis[]
}

export type AgentStatus = "ACTIF" | "EN_PAUSE" | "ERREUR" | "INACTIF"

export interface Lead {
  id: string
  nom: string
  prenom?: string
  email: string
  telephone?: string
  raisonSociale?: string
  siret?: string
  fonction?: string
  type: ClientType
  source: LeadSource
  statut: LeadStatus
  notes?: string
  budgetEstime?: number
  dateCreation: string
  dateMiseAJour: string
}

export interface AIAgent {
  id: string
  nom: string
  description: string
  type: "PROSPECTION" | "QUALIFICATION" | "SUIVI" | "REPORTING"
  statut: AgentStatus
  derniereExecution?: string
  tauxReussite?: number
  actionsRealisees: number
  configuration: Record<string, unknown>
}

export interface KpiData {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: string
}

export interface ChartDataPoint {
  mois: string
  leads: number
  convertis: number
  ca: number
}
