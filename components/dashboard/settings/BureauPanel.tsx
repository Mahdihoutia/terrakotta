"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  MapPin,
  Receipt,
  ShieldCheck,
  Palette,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { invalidateOrganisation } from "@/lib/hooks/use-organisation";

interface OrganisationDto {
  id: string;
  raisonSociale: string;
  formeJuridique: string | null;
  siret: string | null;
  codeApe: string | null;
  capital: number | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string | null;
  email: string | null;
  telephone: string | null;
  siteWeb: string | null;
  regimeTVA: string | null;
  mentionTVA: string | null;
  iban: string | null;
  bic: string | null;
  banqueNom: string | null;
  rgeNumero: string | null;
  rgeValiditeJusqu: string | null;
  decennaleCompagnie: string | null;
  decennalePolice: string | null;
  rcpCompagnie: string | null;
  rcpPolice: string | null;
  logoUrl: string | null;
  couleurAccent: string | null;
  conditionsPaiement: string | null;
  cgvUrl: string | null;
}

const REGIMES_TVA: { value: string; label: string; mention?: string }[] = [
  { value: "NORMAL", label: "Régime normal" },
  {
    value: "FRANCHISE_BASE",
    label: "Franchise en base",
    mention: "TVA non applicable, art. 293 B du CGI",
  },
  { value: "REEL_SIMPLIFIE", label: "Réel simplifié" },
  { value: "REEL_NORMAL", label: "Réel normal" },
];

function emptyForm(): OrganisationDto {
  return {
    id: "",
    raisonSociale: "",
    formeJuridique: null,
    siret: null,
    codeApe: null,
    capital: null,
    adresse: null,
    codePostal: null,
    ville: null,
    pays: "France",
    email: null,
    telephone: null,
    siteWeb: null,
    regimeTVA: null,
    mentionTVA: null,
    iban: null,
    bic: null,
    banqueNom: null,
    rgeNumero: null,
    rgeValiditeJusqu: null,
    decennaleCompagnie: null,
    decennalePolice: null,
    rcpCompagnie: null,
    rcpPolice: null,
    logoUrl: null,
    couleurAccent: "#2563EB",
    conditionsPaiement: null,
    cgvUrl: null,
  };
}

export default function BureauPanel() {
  const [form, setForm] = useState<OrganisationDto>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [migrationPending, setMigrationPending] = useState<string | null>(null);

  const fetchOrg = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organisation");
      if (res.status === 503) {
        const j = await res.json().catch(() => null);
        setMigrationPending(j?.message ?? "Migration requise.");
        return;
      }
      if (!res.ok) {
        await showApiError(res, "Chargement du bureau impossible");
        return;
      }
      const data = (await res.json()) as OrganisationDto | null;
      setMigrationPending(null);
      if (data) setForm(data);
    } catch (err) {
      showNetworkError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  function update<K extends keyof OrganisationDto>(key: K, value: OrganisationDto[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyRegimeTVA(value: string) {
    const found = REGIMES_TVA.find((r) => r.value === value);
    setForm((prev) => ({
      ...prev,
      regimeTVA: value,
      mentionTVA: found?.mention ?? prev.mentionTVA,
    }));
  }

  async function handleSave() {
    if (!form.raisonSociale.trim()) {
      toast.error("La raison sociale est requise.");
      return;
    }
    if (form.siret && !/^\d{14}$/.test(form.siret.replace(/\s/g, ""))) {
      toast.error("SIRET = 14 chiffres.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/organisation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          siret: form.siret?.replace(/\s/g, "") || null,
          rgeValiditeJusqu: form.rgeValiditeJusqu
            ? new Date(form.rgeValiditeJusqu).toISOString()
            : null,
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Sauvegarde impossible");
        return;
      }
      const data = (await res.json()) as OrganisationDto;
      setForm(data);
      invalidateOrganisation();
      toast.success("Bureau mis à jour. Les exports utiliseront ces informations.");
    } catch (err) {
      showNetworkError(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (migrationPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Migration en attente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{migrationPending}</p>
          <p>
            Exécute{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              prisma/migrations/_manual/2026_05_09_add_organisation_and_invitations.sql
            </code>{" "}
            puis recharge cette page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ces informations sont injectées dans tous les documents générés (devis,
        factures, audits, rapports). Un seul enregistrement est conservé.
      </p>

      {/* ─── Identité ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Identité
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Raison sociale *"
            value={form.raisonSociale}
            onChange={(v) => update("raisonSociale", v)}
            placeholder="Kilowater SAS"
            required
          />
          <Select
            label="Forme juridique"
            value={form.formeJuridique ?? ""}
            onChange={(v) => update("formeJuridique", v || null)}
            options={["", "EI", "EIRL", "EURL", "SARL", "SAS", "SASU", "SA", "SCOP", "Auto-entrepreneur"]}
          />
          <Field
            label="SIRET"
            value={form.siret ?? ""}
            onChange={(v) => update("siret", v || null)}
            placeholder="14 chiffres"
            inputMode="numeric"
          />
          <Field
            label="Code APE / NAF"
            value={form.codeApe ?? ""}
            onChange={(v) => update("codeApe", v || null)}
            placeholder="Ex: 7112B"
          />
          <Field
            label="Capital social (€)"
            value={form.capital == null ? "" : String(form.capital)}
            onChange={(v) => update("capital", v ? Number(v) : null)}
            type="number"
            placeholder="10 000"
          />
        </CardContent>
      </Card>

      {/* ─── Coordonnées ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Coordonnées
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Adresse"
              value={form.adresse ?? ""}
              onChange={(v) => update("adresse", v || null)}
              placeholder="12 rue des Lilas"
            />
          </div>
          <Field
            label="Code postal"
            value={form.codePostal ?? ""}
            onChange={(v) => update("codePostal", v || null)}
            placeholder="75011"
          />
          <Field
            label="Ville"
            value={form.ville ?? ""}
            onChange={(v) => update("ville", v || null)}
            placeholder="Paris"
          />
          <Field
            label="Email contact"
            value={form.email ?? ""}
            onChange={(v) => update("email", v || null)}
            type="email"
            placeholder="contact@kilowater.fr"
          />
          <Field
            label="Téléphone"
            value={form.telephone ?? ""}
            onChange={(v) => update("telephone", v || null)}
            placeholder="01 23 45 67 89"
          />
          <Field
            label="Site web"
            value={form.siteWeb ?? ""}
            onChange={(v) => update("siteWeb", v || null)}
            type="url"
            placeholder="https://www.kilowater.fr"
          />
        </CardContent>
      </Card>

      {/* ─── Fiscal & bancaire ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-primary" />
            Fiscal & bancaire
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Régime TVA</Label>
            <select
              value={form.regimeTVA ?? ""}
              onChange={(e) => applyRegimeTVA(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">— Non précisé —</option>
              {REGIMES_TVA.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Mention TVA (sur devis)"
            value={form.mentionTVA ?? ""}
            onChange={(v) => update("mentionTVA", v || null)}
            placeholder="TVA non applicable, art. 293 B du CGI"
          />
          <Field
            label="IBAN"
            value={form.iban ?? ""}
            onChange={(v) => update("iban", v || null)}
            placeholder="FR76 ..."
            className="font-mono text-xs"
          />
          <Field
            label="BIC"
            value={form.bic ?? ""}
            onChange={(v) => update("bic", v || null)}
            placeholder="BNPAFRPP"
            className="font-mono text-xs"
          />
          <Field
            label="Banque"
            value={form.banqueNom ?? ""}
            onChange={(v) => update("banqueNom", v || null)}
            placeholder="BNP Paribas"
          />
        </CardContent>
      </Card>

      {/* ─── Qualifications & assurances ──────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Qualifications & assurances
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="N° RGE"
            value={form.rgeNumero ?? ""}
            onChange={(v) => update("rgeNumero", v || null)}
            placeholder="QB-XXXXX"
          />
          <Field
            label="RGE valide jusqu'au"
            value={form.rgeValiditeJusqu ? form.rgeValiditeJusqu.slice(0, 10) : ""}
            onChange={(v) => update("rgeValiditeJusqu", v || null)}
            type="date"
          />
          <Field
            label="Décennale — compagnie"
            value={form.decennaleCompagnie ?? ""}
            onChange={(v) => update("decennaleCompagnie", v || null)}
            placeholder="MAAF, AXA…"
          />
          <Field
            label="Décennale — n° police"
            value={form.decennalePolice ?? ""}
            onChange={(v) => update("decennalePolice", v || null)}
          />
          <Field
            label="RC pro — compagnie"
            value={form.rcpCompagnie ?? ""}
            onChange={(v) => update("rcpCompagnie", v || null)}
          />
          <Field
            label="RC pro — n° police"
            value={form.rcpPolice ?? ""}
            onChange={(v) => update("rcpPolice", v || null)}
          />
        </CardContent>
      </Card>

      {/* ─── Branding & exports ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" />
            Branding & exports
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="URL du logo (PNG/SVG, fond transparent)"
            value={form.logoUrl ?? ""}
            onChange={(v) => update("logoUrl", v || null)}
            type="url"
            placeholder="https://…/logo.png"
          />
          <div>
            <Label className="text-xs">Couleur d'accent</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={form.couleurAccent || "#2563EB"}
                onChange={(e) => update("couleurAccent", e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background"
                aria-label="Couleur d'accent"
              />
              <Input
                value={form.couleurAccent ?? ""}
                onChange={(e) => update("couleurAccent", e.target.value || null)}
                placeholder="#2563EB"
                className="font-mono text-xs"
              />
            </div>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Conditions de paiement par défaut</Label>
            <Textarea
              value={form.conditionsPaiement ?? ""}
              onChange={(e) => update("conditionsPaiement", e.target.value || null)}
              placeholder="Acompte de 30 % à la signature, solde à la réception. Paiement à 30 jours fin de mois."
              rows={3}
            />
          </div>
          <Field
            label="URL des CGV (PDF hébergé)"
            value={form.cgvUrl ?? ""}
            onChange={(v) => update("cgvUrl", v || null)}
            type="url"
            placeholder="https://…/cgv.pdf"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

/* ─────── Helpers ─────── */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  inputMode,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  inputMode?: "numeric" | "decimal" | "tel" | "email" | "url" | "text";
  className?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        className={className}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "— Non précisée —"}
          </option>
        ))}
      </select>
    </div>
  );
}
