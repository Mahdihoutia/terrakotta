export type LeadStatus = "NOUVEAU" | "CONTACTE" | "QUALIFIE" | "PROPOSITION" | "GAGNE" | "PERDU"

export type LeadSource = "SITE_WEB" | "RECOMMANDATION" | "RESEAU" | "DEMARCHAGE" | "AUTRE"

export type ClientType = "PARTICULIER" | "PROFESSIONNEL" | "COLLECTIVITE"

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
