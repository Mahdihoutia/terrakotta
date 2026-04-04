"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/dashboard/StatusBadge";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Pencil,
  X,
  Mail,
  Phone,
  Building2,
  Calendar,
  Euro,
  StickyNote,
  User,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus, LeadSource, ClientType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const SOURCE_LABELS: Record<LeadSource, string> = {
  SITE_WEB: "Site web",
  RECOMMANDATION: "Recommandation",
  RESEAU: "Réseau",
  DEMARCHAGE: "Démarchage",
  AUTRE: "Autre",
};

const TYPE_LABELS: Record<ClientType, string> = {
  PARTICULIER: "Particulier",
  PROFESSIONNEL: "Professionnel",
  COLLECTIVITE: "Collectivité",
};

function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) return "\u2014";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function LeadDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [form, setForm] = useState({
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
  });

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Lead introuvable");
        return res.json();
      })
      .then((data: Lead) => {
        setLead(data);
        setForm({
          nom: data.nom,
          prenom: data.prenom ?? "",
          email: data.email,
          telephone: data.telephone ?? "",
          raisonSociale: data.raisonSociale ?? "",
          siret: data.siret ?? "",
          type: data.type,
          source: data.source,
          statut: data.statut,
          budgetEstime: data.budgetEstime != null ? String(data.budgetEstime) : "",
          notes: data.notes ?? "",
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!form.nom.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          prenom: form.prenom || null,
          email: form.email,
          telephone: form.telephone || null,
          raisonSociale: form.raisonSociale || null,
          siret: form.siret || null,
          type: form.type,
          source: form.source,
          statut: form.statut,
          budgetEstime: form.budgetEstime ? Number(form.budgetEstime) : null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      const updated: Lead = await res.json();
      setLead(updated);
      setEditing(false);
    } catch {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      router.push("/leads");
    } catch {
      setError("Erreur lors de la suppression");
      setDeleting(false);
    }
  }

  async function handleConvert() {
    setConverting(true);
    try {
      const res = await fetch(`/api/leads/${id}/convert`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors de la conversion");
      const data = await res.json();
      router.push(`/contacts/${data.clientId}`);
    } catch {
      setError("Erreur lors de la conversion");
      setConverting(false);
    }
  }

  function handleCancel() {
    if (lead) {
      setForm({
        nom: lead.nom,
        prenom: lead.prenom ?? "",
        email: lead.email,
        telephone: lead.telephone ?? "",
        raisonSociale: lead.raisonSociale ?? "",
        siret: lead.siret ?? "",
        type: lead.type,
        source: lead.source,
        statut: lead.statut,
        budgetEstime: lead.budgetEstime != null ? String(lead.budgetEstime) : "",
        notes: lead.notes ?? "",
      });
    }
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#5a6478]" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error ?? "Lead introuvable"}</p>
        <Link href="/leads">
          <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-[#c8d0e0]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux leads
          </Button>
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors";
  const labelClass = "text-xs font-medium text-[#7a849a] mb-1.5 block";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-[#5a6478] hover:text-[#e8ecf4] hover:bg-white/[0.06]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#e8ecf4]">
              {editing ? "Modifier le lead" : lead.nom}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge statut={editing ? form.statut : lead.statut} />
              <span className="text-xs text-[#5a6478]">
                Créé le {lead.dateCreation} · Modifié le {lead.dateMiseAJour}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="border-white/10 bg-white/5 text-[#c8d0e0] hover:bg-white/10"
              >
                <X className="mr-2 h-3.5 w-3.5" />
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-3.5 w-3.5" />
                )}
                Enregistrer
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConvertConfirm(true)}
                className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <UserCheck className="mr-2 h-3.5 w-3.5" />
                Convertir en contact
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Supprimer
              </Button>
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Modifier
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-[#e8ecf4] mb-2">Supprimer ce lead ?</h3>
              <p className="text-sm text-[#7a849a] mb-6">
                Cette action est irréversible. Le lead <span className="text-[#e8ecf4] font-medium">{lead.nom}</span> sera définitivement supprimé.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="border-white/10 bg-white/5 text-[#c8d0e0] hover:bg-white/10"
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                  )}
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Convert confirmation modal */}
      <AnimatePresence>
        {showConvertConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConvertConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-[#e8ecf4] mb-2">Convertir en contact ?</h3>
              <p className="text-sm text-[#7a849a] mb-6">
                Le lead <span className="text-[#e8ecf4] font-medium">{lead.nom}</span> sera converti en contact et supprimé de la liste des leads.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConvertConfirm(false)}
                  className="border-white/10 bg-white/5 text-[#c8d0e0] hover:bg-white/10"
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleConvert}
                  disabled={converting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {converting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="mr-2 h-3.5 w-3.5" />
                  )}
                  Convertir
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {editing ? (
        /* ─── Mode édition ─────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Nom *</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom de famille"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prénom</label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                placeholder="Prénom"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemple.fr"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                placeholder="06 XX XX XX XX"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Raison Sociale</label>
              <input
                type="text"
                value={form.raisonSociale}
                onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
                placeholder="Raison sociale (optionnel)"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>N° SIRET</label>
              <input
                type="text"
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                placeholder="123 456 789 00012"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ClientType })}
                className={inputClass}
              >
                <option value="PARTICULIER">Particulier</option>
                <option value="PROFESSIONNEL">Professionnel</option>
                <option value="COLLECTIVITE">Collectivité</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })}
                className={inputClass}
              >
                <option value="SITE_WEB">Site web</option>
                <option value="RECOMMANDATION">Recommandation</option>
                <option value="RESEAU">Réseau</option>
                <option value="DEMARCHAGE">Démarchage</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value as LeadStatus })}
                className={inputClass}
              >
                <option value="NOUVEAU">Nouveau</option>
                <option value="CONTACTE">Contacté</option>
                <option value="QUALIFIE">Qualifié</option>
                <option value="PROPOSITION">Proposition</option>
                <option value="GAGNE">Gagné</option>
                <option value="PERDU">Perdu</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Budget estimé (€)</label>
              <input
                type="number"
                value={form.budgetEstime}
                onChange={(e) => setForm({ ...form, budgetEstime: e.target.value })}
                placeholder="Ex: 25000"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4}
                placeholder="Informations complémentaires..."
                className={cn(inputClass, "resize-none")}
              />
            </div>
          </div>
        </motion.div>
      ) : (
        /* ─── Mode lecture ─────────────────────────────────────── */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de contact */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#e8ecf4] mb-4">Informations de contact</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={<User className="h-4 w-4" />} label="Nom" value={lead.nom} />
                <InfoRow icon={<User className="h-4 w-4" />} label="Prénom" value={lead.prenom ?? "\u2014"} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={lead.email} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={lead.telephone ?? "\u2014"} />
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Raison Sociale" value={lead.raisonSociale ?? "\u2014"} />
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="N° SIRET" value={lead.siret ?? "\u2014"} />
              </div>
            </div>

            {/* Notes */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#e8ecf4] mb-4 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-[#5a6478]" />
                Notes
              </h2>
              <p className="text-sm text-[#c8d0e0] whitespace-pre-wrap leading-relaxed">
                {lead.notes || "Aucune note pour ce lead."}
              </p>
            </div>
          </div>

          {/* Barre latérale */}
          <div className="space-y-6">
            {/* Détails */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#e8ecf4] mb-4">Détails</h2>
              <div className="space-y-4">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Type"
                  value={TYPE_LABELS[lead.type]}
                />
                <InfoRow
                  icon={<Euro className="h-4 w-4" />}
                  label="Budget estimé"
                  value={formatCurrency(lead.budgetEstime)}
                />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#5a6478] mb-1">Source</p>
                  <span className="inline-block rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-[#c8d0e0]">
                    {SOURCE_LABELS[lead.source]}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#e8ecf4] mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#5a6478]" />
                Historique
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#5a6478]">Créé le</p>
                  <p className="text-sm text-[#c8d0e0]">{lead.dateCreation}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#5a6478]">Dernière modification</p>
                  <p className="text-sm text-[#c8d0e0]">{lead.dateMiseAJour}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Ligne d'information réutilisable */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#5a6478]">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#5a6478]">{label}</p>
        <p className="text-sm text-[#c8d0e0]">{value}</p>
      </div>
    </div>
  );
}
