"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Zap, Pause, AlertTriangle } from "lucide-react";
import type { AgentStatus } from "@/types";
import { cn } from "@/lib/utils";

interface AgentSummary {
  id: string;
  nom: string;
  type: string;
  statut: AgentStatus;
  actionsAujourdhui: number;
}

const DEMO_AGENTS: AgentSummary[] = [
  {
    id: "1",
    nom: "Prospecteur Web",
    type: "Prospection",
    statut: "ACTIF",
    actionsAujourdhui: 23,
  },
  {
    id: "2",
    nom: "Qualificateur Leads",
    type: "Qualification",
    statut: "ACTIF",
    actionsAujourdhui: 12,
  },
  {
    id: "3",
    nom: "Relance Auto",
    type: "Suivi",
    statut: "EN_PAUSE",
    actionsAujourdhui: 0,
  },
  {
    id: "4",
    nom: "Rapport Hebdo",
    type: "Reporting",
    statut: "ACTIF",
    actionsAujourdhui: 1,
  },
];

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ACTIF: {
    label: "Actif",
    className: "bg-emerald-100 text-emerald-800",
    icon: Zap,
  },
  EN_PAUSE: {
    label: "En pause",
    className: "bg-yellow-100 text-yellow-800",
    icon: Pause,
  },
  ERREUR: {
    label: "Erreur",
    className: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
  INACTIF: {
    label: "Inactif",
    className: "bg-gray-100 text-gray-800",
    icon: Pause,
  },
};

export default function AgentStatusCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI Agents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {DEMO_AGENTS.map((agent) => {
            const config = STATUS_CONFIG[agent.statut];
            const StatusIcon = config.icon;
            return (
              <div
                key={agent.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{agent.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {agent.actionsAujourdhui} actions
                  </span>
                  <Badge className={cn("gap-1", config.className)}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
