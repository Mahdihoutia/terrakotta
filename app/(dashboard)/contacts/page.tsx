"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/dashboard/StatusBadge";
import {
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  UserCircle,
  ArrowRight,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContacts } from "@/lib/hooks/use-contacts";
import type { ClientType, LeadStatus, LeadSource } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

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

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  adresse: "",
  raisonSociale: "",
  siret: "",
  type: "PARTICULIER" as ClientType,
  source: "SITE_WEB" as LeadSource,
  statut: "NOUVEAU" as LeadStatus,
  budgetEstime: "",
  notes: "",
};

export default function ContactsPage() {
  const { contacts, loading, error, addContact, deleteContact } = useContacts();
  const [filterType, setFilterType] = useState<string>("TOUS");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const filtered = contacts.filter((c) => {
    const matchType = filterType === "TOUS" || c.type === filterType;
    const matchSearch =
      !search ||
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.raisonSociale?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  async function handleCreate() {
    if (!form.nom.trim()) return;
    setSubmitting(true);
    await addContact({
      nom: form.nom,
      prenom: form.prenom || null,
      email: form.email || null,
      telephone: form.telephone || null,
      adresse: form.adresse || null,
      raisonSociale: form.raisonSociale || null,
      siret: form.siret || null,
      type: form.type,
      source: form.source,
      statut: form.statut,
      budgetEstime: form.budgetEstime ? Number(form.budgetEstime) : null,
      notes: form.notes || null,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSubmitting(false);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await deleteContact(id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-tk-text-faint" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const countByType = (type: string) => contacts.filter((c) => c.type === type).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tk-text">Contacts</h1>
          <p className="text-tk-text-faint">
            Clients et contacts professionnels — {contacts.length} au total
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau contact
        </Button>
      </div>

      {/* Formulaire nouveau contact */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="glass rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-tk-text">Nouveau contact</h3>
                <button onClick={() => setShowForm(false)} className="text-tk-text-faint hover:text-tk-text-secondary">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Nom *</label>
                  <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Nom de famille" className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Prénom</label>
                  <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    placeholder="Prénom" className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemple.fr" className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Téléphone</label>
                  <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    placeholder="06 XX XX XX XX" className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Entreprise</label>
                  <input type="text" value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
                    placeholder="Raison sociale" className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">N° SIRET</label>
                  <input type="text" value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })}
                    placeholder="123 456 789 00012" className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ClientType })}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text">
                    <option value="PARTICULIER">Particulier</option>
                    <option value="PROFESSIONNEL">Professionnel</option>
                    <option value="COLLECTIVITE">Collectivité</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Source</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text">
                    <option value="SITE_WEB">Site web</option>
                    <option value="RECOMMANDATION">Recommandation</option>
                    <option value="RESEAU">Réseau</option>
                    <option value="DEMARCHAGE">Démarchage</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Statut</label>
                  <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as LeadStatus })}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text">
                    <option value="NOUVEAU">Nouveau</option>
                    <option value="CONTACTE">Contacté</option>
                    <option value="QUALIFIE">Qualifié</option>
                    <option value="PROPOSITION">Proposition</option>
                    <option value="GAGNE">Gagné</option>
                    <option value="PERDU">Perdu</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Budget estimé (€)</label>
                  <input type="number" value={form.budgetEstime} onChange={(e) => setForm({ ...form, budgetEstime: e.target.value })}
                    placeholder="Ex: 25000" className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text" />
                </div>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                  <label className="text-xs font-medium text-tk-text-muted">Adresse</label>
                  <input type="text" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    placeholder="Adresse complète" className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text" />
                </div>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-medium text-tk-text-muted">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2} placeholder="Informations complémentaires..."
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text resize-none" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
                  Créer le contact
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}
                  className="border-tk-border bg-tk-surface text-tk-text-secondary hover:bg-tk-hover">
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-tk-border bg-tk-surface px-3 sm:max-w-xs">
          <Search className="h-4 w-4 text-tk-text-faint" />
          <input type="text" placeholder="Rechercher un contact..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-full w-full bg-transparent text-sm text-tk-text outline-none placeholder:text-tk-text-faint" />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="mr-1 h-4 w-4 text-tk-text-faint" />
          {["TOUS", "PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"].map((t) => (
            <Button key={t} variant={filterType === t ? "default" : "outline"} size="sm"
              onClick={() => setFilterType(t)}
              className={cn("text-xs", filterType !== t && "border-tk-border bg-tk-surface text-tk-text-muted hover:bg-tk-hover hover:text-tk-text-secondary")}>
              {t === "TOUS" ? "Tous" : TYPE_LABELS[t]}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="rounded-lg bg-orange-500/10 p-2"><UserCircle className="h-5 w-5 text-orange-400" /></div>
          <div><p className="text-2xl font-bold text-tk-text">{contacts.length}</p><p className="text-xs text-tk-text-faint">Contacts totaux</p></div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2"><UserCircle className="h-5 w-5 text-blue-400" /></div>
          <div><p className="text-2xl font-bold text-tk-text">{countByType("PARTICULIER")}</p><p className="text-xs text-tk-text-faint">Particuliers</p></div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2"><Building2 className="h-5 w-5 text-emerald-400" /></div>
          <div><p className="text-2xl font-bold text-tk-text">{countByType("PROFESSIONNEL")}</p><p className="text-xs text-tk-text-faint">Professionnels</p></div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2"><Building2 className="h-5 w-5 text-violet-400" /></div>
          <div><p className="text-2xl font-bold text-tk-text">{countByType("COLLECTIVITE")}</p><p className="text-xs text-tk-text-faint">Collectivités</p></div>
        </div>
      </div>

      {/* Tableau */}
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead>Contact</TableHead>
              <TableHead>Coordonnées</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((contact) => (
              <TableRow key={contact.id} className="group border-white/[0.04] hover:bg-tk-surface">
                <TableCell>
                  <Link href={`/contacts/${contact.id}`} className="block">
                    <p className="font-medium text-tk-text">
                      {contact.prenom ? `${contact.prenom} ${contact.nom}` : contact.nom}
                    </p>
                    {contact.raisonSociale && <p className="text-[10px] text-tk-text-faint">{contact.raisonSociale}</p>}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {contact.email && (
                      <span className="flex items-center gap-1 text-xs text-tk-text-secondary">
                        <Mail className="h-3 w-3 text-tk-text-faint" /> {contact.email}
                      </span>
                    )}
                    {contact.telephone && (
                      <span className="flex items-center gap-1 text-xs text-tk-text-muted">
                        <Phone className="h-3 w-3" /> {contact.telephone}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", TYPE_STYLES[contact.type])}>
                    {TYPE_LABELS[contact.type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-tk-text-muted">
                  {SOURCE_LABELS[contact.source]}
                </TableCell>
                <TableCell className="text-sm font-medium text-tk-text-secondary">
                  {formatCurrency(contact.budgetEstime)}
                </TableCell>
                <TableCell>
                  <StatusBadge statut={contact.statut} />
                </TableCell>
                <TableCell className="text-xs text-tk-text-faint">
                  {contact.dateCreation}
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/contacts/${contact.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-tk-text-muted hover:text-tk-text">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-tk-text-muted hover:text-red-400"
                      onClick={(e) => handleDelete(contact.id, e)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-tk-text-faint">Aucun contact trouvé</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
