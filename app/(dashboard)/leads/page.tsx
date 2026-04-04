"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/dashboard/StatusBadge";
import {
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads } from "@/lib/hooks/use-leads";
import { exportToExcel, exportToPdf } from "@/lib/export-leads";
import type { LeadStatus, LeadSource, ClientType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const SOURCE_LABELS: Record<string, string> = {
  SITE_WEB: "Site web",
  RECOMMANDATION: "Recommandation",
  RESEAU: "Réseau",
  DEMARCHAGE: "Démarchage",
  AUTRE: "Autre",
};

function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) return "\u2014";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  raisonSociale: "",
  siret: "",
  type: "PARTICULIER" as ClientType,
  source: "SITE_WEB" as LeadSource,
  statut: "NOUVEAU" as LeadStatus,
  budgetEstime: "",
  notes: "",
};

export default function LeadsPage() {
  const { leads, loading, error, addLead, deleteLead } = useLeads();

  const [filterStatut, setFilterStatut] = useState<string>("TOUS");
  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const filteredLeads =
    filterStatut === "TOUS"
      ? leads
      : leads.filter((l) => l.statut === filterStatut);

  const statuts = ["TOUS", "NOUVEAU", "CONTACTE", "QUALIFIE", "PROPOSITION", "GAGNE", "PERDU"];

  async function handleCreate() {
    if (!form.nom.trim() || !form.email.trim()) return;
    setSubmitting(true);
    await addLead({
      nom: form.nom,
      prenom: form.prenom || undefined,
      email: form.email,
      telephone: form.telephone || undefined,
      raisonSociale: form.raisonSociale || undefined,
      siret: form.siret || undefined,
      type: form.type,
      source: form.source,
      statut: form.statut,
      budgetEstime: form.budgetEstime ? Number(form.budgetEstime) : undefined,
      notes: form.notes || undefined,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSubmitting(false);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await deleteLead(id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#5a6478]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <p className="text-[#5a6478] text-xs">
          Vérifiez la connexion à la base de données Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e8ecf4]">Leads</h1>
          <p className="text-[#5a6478]">
            Gérez et suivez vos prospects — {leads.length} au total
          </p>
        </div>
        <div className="flex gap-2">
          {/* Export dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExport(!showExport)}
              className="border-white/10 bg-white/5 text-[#c8d0e0] hover:bg-white/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
            <AnimatePresence>
              {showExport && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl glass p-1"
                >
                  <button
                    onClick={() => { exportToExcel(filteredLeads); setShowExport(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#c8d0e0] hover:bg-white/[0.08]"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-400" />
                    Export Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => { exportToPdf(filteredLeads); setShowExport(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#c8d0e0] hover:bg-white/[0.08]"
                  >
                    <FileText className="h-4 w-4 text-red-400" />
                    Export PDF
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau lead
          </Button>
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="glass rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#e8ecf4]">Nouveau lead</h3>
                <button onClick={() => setShowForm(false)} className="text-[#5a6478] hover:text-[#c8d0e0]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a849a]">Nom *</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Nom de famille"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a849a]">Prénom</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    placeholder="Prénom"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a849a]">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemple.fr"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a849a]">Téléphone</label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    placeholder="06 XX XX XX XX"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a849a]">Raison Sociale</label>
                  <input
                    type="text"
                    value={form.raisonSociale}
                    onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
                    placeholder="Raison sociale (optionnel)"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a849a]">N° SIRET</label>
                  <input
                    type="text"
                    value={form.siret}
                    onChange={(e) => setForm({ ...form, siret: e.target.value })}
                    placeholder="123 456 789 00012"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a849a]">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as ClientType })}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4]"
                  >
                    <option value="PARTICULIER">Particulier</option>
                    <option value="PROFESSIONNEL">Professionnel</option>
                    <option value="COLLECTIVITE">Collectivité</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a849a]">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4]"
                  >
                    <option value="SITE_WEB">Site web</option>
                    <option value="RECOMMANDATION">Recommandation</option>
                    <option value="RESEAU">Réseau</option>
                    <option value="DEMARCHAGE">Démarchage</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a849a]">Budget estimé</label>
                  <input
                    type="number"
                    value={form.budgetEstime}
                    onChange={(e) => setForm({ ...form, budgetEstime: e.target.value })}
                    placeholder="Ex: 25000"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4]"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-[#7a849a]">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    placeholder="Informations complémentaires..."
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4] resize-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-3.5 w-3.5" />
                  )}
                  Créer le lead
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="border-white/10 bg-white/5 text-[#c8d0e0] hover:bg-white/10"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-[#5a6478]" />
        <div className="flex gap-1">
          {statuts.map((s) => (
            <Button
              key={s}
              variant={filterStatut === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatut(s)}
              className={cn(
                "text-xs whitespace-nowrap",
                filterStatut !== s && "border-white/10 bg-white/5 text-[#7a849a] hover:bg-white/10 hover:text-[#c8d0e0]"
              )}
            >
              {s === "TOUS" ? `Tous (${leads.length})` : s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead>Nom</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Budget estimé</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow
                key={lead.id}
                className="group border-white/[0.04] hover:bg-white/[0.04]"
              >
                <TableCell>
                  <Link href={`/leads/${lead.id}`} className="block">
                    <p className="font-medium text-[#e8ecf4]">
                      {lead.prenom ? `${lead.prenom} ${lead.nom}` : lead.nom}
                    </p>
                    {lead.raisonSociale && (
                      <p className="text-[10px] text-[#5a6478]">{lead.raisonSociale}</p>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs text-[#c8d0e0]">
                      <Mail className="h-3 w-3 text-[#5a6478]" /> {lead.email}
                    </span>
                    {lead.telephone && (
                      <span className="flex items-center gap-1 text-xs text-[#7a849a]">
                        <Phone className="h-3 w-3" /> {lead.telephone}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#7a849a]">
                    {lead.type.charAt(0) + lead.type.slice(1).toLowerCase()}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-[#7a849a]">
                  {SOURCE_LABELS[lead.source]}
                </TableCell>
                <TableCell className="text-sm font-medium text-[#c8d0e0]">
                  {formatCurrency(lead.budgetEstime)}
                </TableCell>
                <TableCell>
                  <StatusBadge statut={lead.statut} />
                </TableCell>
                <TableCell className="text-xs text-[#5a6478]">
                  {lead.dateCreation}
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/leads/${lead.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#7a849a] hover:text-[#e8ecf4]">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#7a849a] hover:text-red-400"
                      onClick={(e) => handleDelete(lead.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredLeads.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-[#5a6478]">
                  Aucun lead trouvé pour ce filtre
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
