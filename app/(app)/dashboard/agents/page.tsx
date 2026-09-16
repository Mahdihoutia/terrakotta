"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Zap,
  Pause,
  Play,
  Settings,
  Plus,
  Activity,
  Search,
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Rocket,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIAgent, AgentLog, AgentStatus, AgentType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

// ─── Status config ─────────────────────────────────────────────

const STATUS_CONFIG: Record<AgentStatus, { label: string; className: string; dotClass: string }> = {
  ACTIF: { label: "Actif", className: "bg-emerald-100 text-emerald-800", dotClass: "bg-emerald-500" },
  EN_PAUSE: { label: "En pause", className: "bg-yellow-100 text-yellow-800", dotClass: "bg-yellow-500" },
  ERREUR: { label: "Erreur", className: "bg-red-100 text-red-800", dotClass: "bg-red-500" },
  INACTIF: { label: "Inactif", className: "bg-gray-100 text-gray-800", dotClass: "bg-gray-400" },
};

const TYPE_CONFIG: Record<AgentType, { label: string; icon: typeof Bot; color: string }> = {
  PROSPECTION: { label: "Prospection", icon: Search, color: "text-blue-600 bg-blue-100" },
  COMMUNICATION: { label: "Communication", icon: Mail, color: "text-purple-600 bg-purple-100" },
};

const LOG_ACTION_LABELS: Record<string, { label: string; icon: typeof CheckCircle2 }> = {
  search_started: { label: "Recherche lancée", icon: Search },
  lead_created: { label: "Lead créé", icon: Plus },
  lead_creation_failed: { label: "Erreur création lead", icon: XCircle },
  email_sent: { label: "Email envoyé", icon: Mail },
  email_failed: { label: "Erreur envoi email", icon: XCircle },
  communication_report: { label: "Rapport communication", icon: Activity },
};

// ─── Create Agent Modal ────────────────────────────────────────

interface CreateAgentFormProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateAgentForm({ onClose, onCreated }: CreateAgentFormProps) {
  const [type, setType] = useState<AgentType>("PROSPECTION");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!nom.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          description: description.trim() || undefined,
          type,
          email: type === "COMMUNICATION" && email.trim() ? email.trim() : undefined,
        }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold mb-4">Nouvel Agent AI</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Type d&apos;agent</label>
            <div className="grid grid-cols-2 gap-2">
              {(["PROSPECTION", "COMMUNICATION"] as AgentType[]).map((t) => {
                const cfg = TYPE_CONFIG[t];
                const Icon = cfg.icon;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors",
                      type === t ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50",
                    )}
                  >
                    <div className={cn("rounded-md p-1.5", cfg.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Nom de l&apos;agent</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder={type === "PROSPECTION" ? "Prospecteur Web" : "Agent Email"}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez ce que fait cet agent..."
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {type === "COMMUNICATION" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email d&apos;envoi</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@kilowater.fr"
                type="email"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email utilisé pour envoyer les communications aux leads
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={creating || !nom.trim()}>
            {creating ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
            Créer l&apos;agent
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Agent Card ────────────────────────────────────────────────

interface AgentCardProps {
  agent: AIAgent;
  onRefresh: () => void;
}

function AgentCard({ agent, onRefresh }: AgentCardProps) {
  const [executing, setExecuting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const config = STATUS_CONFIG[agent.statut];
  const typeConfig = TYPE_CONFIG[agent.type];
  const TypeIcon = typeConfig.icon;

  async function toggleStatus() {
    setToggling(true);
    const newStatut = agent.statut === "ACTIF" ? "EN_PAUSE" : "ACTIF";
    try {
      await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });
      onRefresh();
    } finally {
      setToggling(false);
    }
  }

  async function execute() {
    setExecuting(true);
    setLastResult(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/execute`, { method: "POST" });
      const data = await res.json();
      setLastResult(data.message || "Exécution terminée");
      onRefresh();
    } catch {
      setLastResult("Erreur lors de l'exécution");
    } finally {
      setExecuting(false);
    }
  }

  async function loadLogs() {
    if (showLogs) {
      setShowLogs(false);
      return;
    }
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/logs?limit=20`);
      const data = await res.json();
      setLogs(data.logs || []);
      setShowLogs(true);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <div className={cn("absolute left-0 top-0 h-full w-1", config.dotClass)} />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", typeConfig.color)}>
                <TypeIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{agent.nom}</CardTitle>
                <Badge variant="outline" className="mt-1 text-xs">
                  {typeConfig.label}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("gap-1", config.className)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
                {config.label}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {confirmDelete && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border border-red-200 bg-red-50 p-3"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Supprimer cet agent ?
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      L&apos;agent et tout son historique seront supprimés définitivement.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="h-7 text-xs"
                      >
                        {deleting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                        Supprimer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDelete(false)}
                        className="h-7 text-xs"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {agent.description && (
            <p className="text-sm text-muted-foreground">{agent.description}</p>
          )}

          {agent.type === "COMMUNICATION" && agent.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              <Mail className="h-3.5 w-3.5" />
              <span>{agent.email}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold">{agent._count?.logs ?? 0}</p>
              <p className="text-xs text-muted-foreground">Actions totales</p>
            </div>
            <div>
              <p className="text-lg font-bold">{agent.actionsAujourdhui ?? 0}</p>
              <p className="text-xs text-muted-foreground">Aujourd&apos;hui</p>
            </div>
            <div>
              <p className="text-lg font-bold">{agent.tauxReussite ?? 0}%</p>
              <p className="text-xs text-muted-foreground">Réussite</p>
            </div>
          </div>

          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              >
                <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
                {lastResult}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {agent.derniereExecution
                  ? `Dernière : ${new Date(agent.derniereExecution).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                  : "Jamais exécuté"}
              </span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={execute}
                disabled={executing || agent.statut !== "ACTIF"}
                title={agent.statut !== "ACTIF" ? "Activez l'agent pour l'exécuter" : "Exécuter maintenant"}
              >
                {executing ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Rocket className="mr-1 h-3 w-3" />
                )}
                Exécuter
              </Button>
              <Button variant="outline" size="sm" onClick={toggleStatus} disabled={toggling}>
                {toggling ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : agent.statut === "ACTIF" ? (
                  <Pause className="mr-1 h-3 w-3" />
                ) : (
                  <Play className="mr-1 h-3 w-3" />
                )}
                {agent.statut === "ACTIF" ? "Pause" : "Activer"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={loadLogs}
                disabled={loadingLogs}
              >
                {loadingLogs ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : showLogs ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showLogs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t pt-3 space-y-2 max-h-[300px] overflow-y-auto">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Historique récent
                  </h4>
                  {logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Aucune action enregistrée</p>
                  ) : (
                    logs.map((log) => {
                      const actionCfg = LOG_ACTION_LABELS[log.action];
                      const LogIcon = actionCfg?.icon ?? Activity;
                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 text-xs"
                        >
                          <LogIcon
                            className={cn(
                              "h-3.5 w-3.5 mt-0.5 shrink-0",
                              log.succes ? "text-emerald-500" : "text-red-500",
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">
                              {actionCfg?.label ?? log.action}
                            </span>
                            {log.details && typeof log.details === "object" && (
                              <span className="text-muted-foreground ml-1">
                                {formatLogDetails(log)}
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground shrink-0">
                            {new Date(log.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatLogDetails(log: AgentLog): string {
  const d = log.details as Record<string, unknown>;
  if (log.action === "lead_created" && d.nom) return `— ${d.nom}`;
  if (log.action === "email_sent" && d.leadNom) return `→ ${d.leadNom} (${d.to})`;
  if (log.action === "communication_report") return `— ${d.emailsSent} envoyés`;
  if (log.action === "search_started" && d.leadsCreated !== undefined) return `— ${d.leadsCreated} leads créés`;
  return "";
}

// ─── Main Page ─────────────────────────────────────────────────

export default function AgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const activeCount = agents.filter((a) => a.statut === "ACTIF").length;
  const todayActions = agents.reduce((sum, a) => sum + (a.actionsAujourdhui ?? 0), 0);
  const totalActions = agents.reduce((sum, a) => sum + (a._count?.logs ?? 0), 0);
  const errorCount = agents.filter((a) => a.statut === "ERREUR").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">
            Prospection automatique et communication avec vos leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAgents}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel agent
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Zap className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
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
                <p className="text-2xl font-bold">{todayActions}</p>
                <p className="text-xs text-muted-foreground">Actions aujourd&apos;hui</p>
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
                <p className="text-2xl font-bold">{totalActions.toLocaleString("fr-FR")}</p>
                <p className="text-xs text-muted-foreground">Actions totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Settings className="h-4 w-4 text-orange-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{errorCount}</p>
                <p className="text-xs text-muted-foreground">Erreurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">Aucun agent configuré</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
              Créez un agent de prospection pour trouver de nouveaux leads automatiquement,
              ou un agent de communication pour envoyer des emails et suivre vos contacts.
            </p>
            <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer mon premier agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onRefresh={fetchAgents} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateAgentForm
            onClose={() => setShowCreate(false)}
            onCreated={fetchAgents}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
