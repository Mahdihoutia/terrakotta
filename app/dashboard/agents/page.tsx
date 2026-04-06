"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Zap,
  Pause,
  AlertTriangle,
  Play,
  Settings,
  Plus,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/types";
import { motion } from "framer-motion";

interface Agent {
  id: string;
  nom: string;
  description: string;
  type: "PROSPECTION" | "QUALIFICATION" | "SUIVI" | "REPORTING";
  statut: AgentStatus;
  derniereExecution: string;
  tauxReussite: number;
  actionsRealisees: number;
  actionsAujourdhui: number;
}

const DEMO_AGENTS: Agent[] = [
  {
    id: "1",
    nom: "Prospecteur Web",
    description:
      "Scrape les annonces de rénovation et identifie les prospects potentiels via les permis de construire et les annonces immobilières.",
    type: "PROSPECTION",
    statut: "ACTIF",
    derniereExecution: "Il y a 5 min",
    tauxReussite: 72,
    actionsRealisees: 1847,
    actionsAujourdhui: 23,
  },
  {
    id: "2",
    nom: "Qualificateur Leads",
    description:
      "Analyse les leads entrants, enrichit les données (type de bâtiment, surface, DPE estimé) et attribue un score de qualification.",
    type: "QUALIFICATION",
    statut: "ACTIF",
    derniereExecution: "Il y a 12 min",
    tauxReussite: 89,
    actionsRealisees: 943,
    actionsAujourdhui: 12,
  },
  {
    id: "3",
    nom: "Relance Automatique",
    description:
      "Envoie des emails de suivi personnalisés aux leads qui n'ont pas répondu sous 48h. Adapte le message selon le profil.",
    type: "SUIVI",
    statut: "EN_PAUSE",
    derniereExecution: "Il y a 2j",
    tauxReussite: 34,
    actionsRealisees: 312,
    actionsAujourdhui: 0,
  },
  {
    id: "4",
    nom: "Rapport Hebdomadaire",
    description:
      "Génère un rapport de synthèse chaque lundi : nouveaux leads, conversions, CA pipeline, performance des agents.",
    type: "REPORTING",
    statut: "ACTIF",
    derniereExecution: "Lundi dernier",
    tauxReussite: 100,
    actionsRealisees: 52,
    actionsAujourdhui: 1,
  },
];

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; className: string; dotClass: string }
> = {
  ACTIF: {
    label: "Actif",
    className: "bg-emerald-100 text-emerald-800",
    dotClass: "bg-emerald-500",
  },
  EN_PAUSE: {
    label: "En pause",
    className: "bg-yellow-100 text-yellow-800",
    dotClass: "bg-yellow-500",
  },
  ERREUR: {
    label: "Erreur",
    className: "bg-red-100 text-red-800",
    dotClass: "bg-red-500",
  },
  INACTIF: {
    label: "Inactif",
    className: "bg-gray-100 text-gray-800",
    dotClass: "bg-gray-400",
  },
};

const TYPE_LABELS: Record<string, string> = {
  PROSPECTION: "Prospection",
  QUALIFICATION: "Qualification",
  SUIVI: "Suivi client",
  REPORTING: "Reporting",
};

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">
            Gérez vos agents d&apos;intelligence artificielle
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouvel agent
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Zap className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Agents actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Activity className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">36</p>
                <p className="text-xs text-muted-foreground">
                  Actions aujourd&apos;hui
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Bot className="h-4 w-4 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">3 154</p>
                <p className="text-xs text-muted-foreground">Actions totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <AlertTriangle className="h-4 w-4 text-orange-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Erreurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {DEMO_AGENTS.map((agent, i) => {
          const config = STATUS_CONFIG[agent.statut];
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <div
                  className={cn(
                    "absolute left-0 top-0 h-full w-1",
                    config.dotClass
                  )}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {agent.nom}
                        </CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {TYPE_LABELS[agent.type]}
                        </Badge>
                      </div>
                    </div>
                    <Badge className={cn("gap-1", config.className)}>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          config.dotClass
                        )}
                      />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold">
                        {agent.actionsRealisees}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Actions totales
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {agent.actionsAujourdhui}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aujourd&apos;hui
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {agent.tauxReussite}%
                      </p>
                      <p className="text-xs text-muted-foreground">Réussite</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      Dernière exécution : {agent.derniereExecution}
                    </span>
                    <div className="flex gap-1">
                      {agent.statut === "EN_PAUSE" ? (
                        <Button variant="outline" size="sm">
                          <Play className="mr-1 h-3 w-3" />
                          Reprendre
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Pause className="mr-1 h-3 w-3" />
                          Pause
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
