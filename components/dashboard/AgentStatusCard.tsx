"use client";

import { useEffect, useState } from "react";
import { Bot, Zap, Pause, AlertTriangle, Search, Mail } from "lucide-react";
import type { AgentStatus, AgentType } from "@/types";
import { cn } from "@/lib/utils";

interface AgentSummary {
  id: string;
  nom: string;
  type: AgentType;
  statut: AgentStatus;
  actionsAujourdhui: number;
}

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; dot: string; icon: React.ComponentType<{ className?: string }> }> = {
  ACTIF: { label: "Actif", color: "text-tk-primary bg-tk-primary/10", dot: "bg-tk-primary", icon: Zap },
  EN_PAUSE: { label: "Pause", color: "text-amber-400 bg-amber-400/10", dot: "bg-amber-400", icon: Pause },
  ERREUR: { label: "Erreur", color: "text-red-400 bg-red-400/10", dot: "bg-red-400", icon: AlertTriangle },
  INACTIF: { label: "Inactif", color: "text-tk-text-faint bg-tk-surface", dot: "bg-tk-text-faint", icon: Pause },
};

const TYPE_ICONS: Record<AgentType, React.ComponentType<{ className?: string }>> = {
  PROSPECTION: Search,
  COMMUNICATION: Mail,
};

const TYPE_LABELS: Record<AgentType, string> = {
  PROSPECTION: "Prospection",
  COMMUNICATION: "Communication",
};

export default function AgentStatusCard() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAgents(
            data.map((a: Record<string, unknown>) => ({
              id: a.id as string,
              nom: a.nom as string,
              type: a.type as AgentType,
              statut: a.statut as AgentStatus,
              actionsAujourdhui: (a.actionsAujourdhui as number) ?? 0,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  if (agents.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-tk-text">AI Agents</h3>
        </div>
        <p className="text-xs text-tk-text-faint text-center py-4">
          Aucun agent configuré
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-tk-text">AI Agents</h3>
        <span className="text-[10px] uppercase tracking-wider text-tk-text-faint">
          Temps réel
        </span>
      </div>
      <div className="space-y-2">
        {agents.map((agent) => {
          const config = STATUS_CONFIG[agent.statut];
          const Icon = TYPE_ICONS[agent.type] ?? Bot;
          return (
            <div
              key={agent.id}
              className="flex items-center justify-between rounded-xl bg-tk-surface p-3 transition-colors hover:bg-tk-hover"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tk-hover">
                  <Icon className="h-4 w-4 text-tk-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-tk-text">{agent.nom}</p>
                  <p className="text-[10px] text-tk-text-faint">{TYPE_LABELS[agent.type]}</p>
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
