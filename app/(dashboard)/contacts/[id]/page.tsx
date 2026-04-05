"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  MapPin,
  Building2,
  Calendar,
  User,
  Euro,
  StickyNote,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientType, LeadStatus, LeadSource } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface ContactDetail {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  raisonSociale: string | null;
  siret: string | null;
  fonction: string | null;
  type: ClientType;
  source: LeadSource;
  statut: LeadStatus;
  budgetEstime: number | null;
  notes: string | null;
  projetsCount: number;
  devisCount: number;
  dateCreation: string;
  dateMiseAJour: string;
}

const TYPE_STYLES: Record<string, string> = {
  PARTICULIER: "bg-blue-400/10 text-blue-400",
  PROFESSIONNEL: "bg-emerald-400/10 text-emerald-400",
  COLLECTIVITE: "bg-violet-400/10 text-violet-400",
};

const TYPE_LABELS: Record<string, string> = {
  PARTICULIER: "Particulier",
  PROFESSIONNEL: "Professionnel",
  COLLECTIVITE: "Collectivité",
};

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

interface Props {
  params: Promise<{ id: string }>;
}

export default function ContactDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    raisonSociale: "",
    siret: "",
    fonction: "",
    type: "PARTICULIER" as ClientType,
    source: "SITE_WEB" as LeadSource,
    statut: "NOUVEAU" as LeadStatus,
    budgetEstime: "",
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Contact introuvable");
        return res.json();
      })
      .then((data: ContactDetail) => {
        setContact(data);
        syncForm(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  function syncForm(data: ContactDetail) {
    setForm({
      nom: data.nom,
      prenom: data.prenom ?? "",
      email: data.email ?? "",
      telephone: data.telephone ?? "",
      adresse: data.adresse ?? "",
      raisonSociale: data.raisonSociale ?? "",
      siret: data.siret ?? "",
      fonction: data.fonction ?? "",
      type: data.type,
      source: data.source,
      statut: data.statut,
      budgetEstime: data.budgetEstime != null ? String(data.budgetEstime) : "",
      notes: data.notes ?? "",
    });
  }

  async function handleSave() {
    if (!form.nom.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          prenom: form.prenom || null,
          email: form.email || null,
          telephone: form.telephone || null,
          adresse: form.adresse || null,
          raisonSociale: form.raisonSociale || null,
          siret: form.siret || null,
          fonction: form.fonction || null,
          type: form.type,
          source: form.source,
          statut: form.statut,
          budgetEstime: form.budgetEstime ? Number(form.budgetEstime) : null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      const updated: ContactDetail = await res.json();
      setContact(updated);
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
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      router.push("/contacts");
    } catch {
      setError("Erreur lors de la suppression");
      setDeleting(false);
    }
  }

  function handleCancel() {
    if (contact) syncForm(contact);
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#5a6478]" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error ?? "Contact introuvable"}</p>
        <Link href="/contacts">
          <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-[#c8d0e0]">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux contacts
          </Button>
        </Link>
      </div>
    );
  }

  const displayName = contact.prenom
    ? `${contact.prenom} ${contact.nom}`
    : contact.nom;

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#e8ecf4] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors";
  const labelClass = "text-xs font-medium text-[#7a849a] mb-1.5 block";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contacts">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-[#5a6478] hover:text-[#e8ecf4] hover:bg-white/[0.06]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#e8ecf4]">
              {editing ? "Modifier le contact" : displayName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("text-xs", TYPE_STYLES[editing ? form.type : contact.type])}>
                {TYPE_LABELS[editing ? form.type : contact.type]}
              </Badge>
              <StatusBadge statut={editing ? form.statut : contact.statut} />
              <span className="text-xs text-[#5a6478]">
                Créé le {contact.dateCreation} · Modifié le {contact.dateMiseAJour}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}
                className="border-white/10 bg-white/5 text-[#c8d0e0] hover:bg-white/10">
                <X className="mr-2 h-3.5 w-3.5" /> Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                Enregistrer
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)}
                className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
              </Button>
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Modifier
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-[#e8ecf4] mb-2">Supprimer ce contact ?</h3>
              <p className="text-sm text-[#7a849a] mb-6">
                Cette action est irréversible. Le contact <span className="text-[#e8ecf4] font-medium">{displayName}</span> sera définitivement supprimé.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}
                  className="border-white/10 bg-white/5 text-[#c8d0e0] hover:bg-white/10">
                  Annuler
                </Button>
                <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
                  {deleting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-2 h-3.5 w-3.5" />}
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {editing ? (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Nom *</label>
              <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom de famille" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prénom</label>
              <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                placeholder="Prénom" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemple.fr" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                placeholder="06 XX XX XX XX" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Raison Sociale</label>
              <input type="text" value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
                placeholder="Raison sociale" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>N° SIRET</label>
              <input type="text" value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })}
                placeholder="123 456 789 00012" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fonction</label>
              <input type="text" value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })}
                placeholder="Ex: Directeur technique" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ClientType })} className={inputClass}>
                <option value="PARTICULIER">Particulier</option>
                <option value="PROFESSIONNEL">Professionnel</option>
                <option value="COLLECTIVITE">Collectivité</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })} className={inputClass}>
                <option value="SITE_WEB">Site web</option>
                <option value="RECOMMANDATION">Recommandation</option>
                <option value="RESEAU">Réseau</option>
                <option value="DEMARCHAGE">Démarchage</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as LeadStatus })} className={inputClass}>
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
              <input type="number" value={form.budgetEstime} onChange={(e) => setForm({ ...form, budgetEstime: e.target.value })}
                placeholder="Ex: 25000" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Adresse</label>
              <input type="text" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                placeholder="Adresse complète" className={inputClass} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4} placeholder="Informations complémentaires..."
                className={cn(inputClass, "resize-none")} />
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#e8ecf4] mb-4">Informations de contact</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={<User className="h-4 w-4" />} label="Nom" value={contact.nom} />
                <InfoRow icon={<User className="h-4 w-4" />} label="Prénom" value={contact.prenom ?? "\u2014"} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={contact.email ?? "\u2014"} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={contact.telephone ?? "\u2014"} />
                <div className="sm:col-span-2">
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Adresse" value={contact.adresse ?? "\u2014"} />
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#e8ecf4] mb-4">Raison Sociale</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Raison Sociale" value={contact.raisonSociale ?? "\u2014"} />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="N° SIRET" value={contact.siret ?? "\u2014"} />
                <InfoRow icon={<User className="h-4 w-4" />} label="Fonction" value={contact.fonction ?? "\u2014"} />
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#e8ecf4] mb-4 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-[#5a6478]" /> Notes
              </h2>
              <p className="text-sm text-[#c8d0e0] whitespace-pre-wrap leading-relaxed">
                {contact.notes || "Aucune note pour ce contact."}
              </p>
            </div>
          </div>

          {/* Barre latérale */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#e8ecf4] mb-4">Détails</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#5a6478] mb-1">Source</p>
                  <span className="inline-block rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-[#c8d0e0]">
                    {SOURCE_LABELS[contact.source]}
                  </span>
                </div>
                <InfoRow icon={<Euro className="h-4 w-4" />} label="Budget estimé" value={formatCurrency(contact.budgetEstime)} />
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#e8ecf4] mb-4">Activité</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#5a6478]">Projets liés</p>
                  <p className="text-2xl font-bold text-[#e8ecf4]">{contact.projetsCount}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#5a6478]">Devis</p>
                  <p className="text-2xl font-bold text-[#e8ecf4]">{contact.devisCount}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#e8ecf4] mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#5a6478]" /> Historique
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#5a6478]">Créé le</p>
                  <p className="text-sm text-[#c8d0e0]">{contact.dateCreation}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#5a6478]">Dernière modification</p>
                  <p className="text-sm text-[#c8d0e0]">{contact.dateMiseAJour}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
