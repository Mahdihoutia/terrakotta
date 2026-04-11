export type LeadStatus = "NOUVEAU" | "CONTACTE" | "QUALIFIE" | "PROPOSITION" | "GAGNE" | "PERDU"

export type LeadSource = "SITE_WEB" | "RECOMMANDATION" | "RESEAU" | "DEMARCHAGE" | "PAGES_JAUNES" | "SOCIETE_COM" | "WEB_SCRAPING" | "AUTRE"

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
  score?: number // 0-5 étoiles
  roleCible?: string
  adresse?: string
  ville?: string
  codePostal?: string
  departement?: string
  surfaceBatiment?: number // en m²
  sourceUrl?: string
  dateCreation: string
  dateMiseAJour: string
}

export type AgentType = "PROSPECTION" | "COMMUNICATION"

export interface AIAgent {
  id: string
  nom: string
  description: string | null
  type: AgentType
  statut: AgentStatus
  email: string | null
  configuration: ProspectionConfig | CommunicationConfig
  createdAt: string
  updatedAt: string
  _count?: { logs: number }
  derniereExecution?: string | null
  tauxReussite?: number
  actionsAujourdhui?: number
}

export interface AgentLog {
  id: string
  agentId: string
  action: string
  details: Record<string, unknown>
  succes: boolean
  createdAt: string
}

export interface ProspectionConfig {
  sources: ("web" | "annuaires" | "reseaux_sociaux" | "permis_construire")[]
  keywords: string[]
  regions: string[]
  autoCreateLead: boolean
  maxLeadsParJour: number
}

export interface CommunicationConfig {
  emailFrom: string
  templates: EmailTemplate[]
  relanceApresJours: number
  maxEmailsParJour: number
}

export interface EmailTemplate {
  id: string
  nom: string
  objet: string
  corps: string
  type: "premier_contact" | "relance" | "qualification" | "proposition"
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
