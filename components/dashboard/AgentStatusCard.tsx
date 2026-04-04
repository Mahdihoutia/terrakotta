"use client";

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
  { id: "1", nom: "Prospecteur Web", type: "Prospection", statut: "ACTIF", actionsAujourdhui: 23 },
  { id: "2", nom: "Qualificateur Leads", type: "Qualification", statut: "ACTIF", actionsAujourdhui: 12 },
  { id: "3", nom: "Relance Auto", type: "Suivi", statut: "EN_PAUSE", actionsAujourdhui: 0 },
  { id: "4", nom: "Rapport Hebdo", type: "Reporting", statut: "ACTIF", actionsAujourdhui: 1 },
];

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; dot: string; icon: React.ComponentType<{ className?: string }> }> = {
  ACTIF: { label: "Actif", color: "text-tk-primary bg-tk-primary/10", dot: "bg-tk-primary", icon: Zap },
  EN_PAUSE: { label: "Pause", color: "text-amber-400 bg-amber-400/10", dot: "bg-amber-400", icon: Pause },
  ERREUR: { label: "Erreur", color: "text-red-400 bg-red-400/10", dot: "bg-red-400", icon: AlertTriangle },
  INACTIF: { label: "Inactif", color: "text-tk-text-faint bg-tk-surface", dot: "bg-tk-text-faint", icon: Pause },
};

export default function AgentStatusCard() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-tk-text">AI Agents</h3>
        <span className="text-[10px] uppercase tracking-wider text-tk-text-faint">
          Temps réel
        </span>
      </div>
      <div className="space-y-2">
        {DEMO_AGENTS.map((agent) => {
          const config = STATUS_CONFIG[agent.statut];
          return (
            <div
              key={agent.id}
              className="flex items-center justify-between rounded-xl bg-tk-surface p-3 transition-colors hover:bg-tk-hover"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tk-hover">
                  <Bot className="h-4 w-4 text-tk-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-tk-text">{agent.nom}</p>
                  <p className="text-[10px] text-tk-text-faint">{agent.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-tk-text-muted">
                  {agent.actionsAujourdhui}
                </span>
                <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", config.color)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                  {config.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
