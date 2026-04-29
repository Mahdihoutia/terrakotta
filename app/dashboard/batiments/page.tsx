"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Loader2, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import { ZONE_CLIMATIQUE_DATA } from "@/lib/thermal/zones";

interface BatimentRow {
  id: string;
  nom: string;
  description: string | null;
  zoneClimatique: string;
  altitude: number | null;
  orientation: string | null;
  projetId: string | null;
  zonesCount: number;
  createdAt: string;
}

const ZONES = Object.keys(ZONE_CLIMATIQUE_DATA);

export default function BatimentsPage() {
  const [list, setList] = useState<BatimentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    description: "",
    zoneClimatique: ZONES[0] ?? "H1a",
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/batiments");
      if (res.status === 503) {
        setMigrationPending(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        await showApiError(res);
        setLoading(false);
        return;
      }
      const data: BatimentRow[] = await res.json();
      setList(data);
    } catch (err) {
      showNetworkError(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/batiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          description: form.description || null,
          zoneClimatique: form.zoneClimatique,
        }),
      });
      if (!res.ok) {
        await showApiError(res);
      } else {
        toast.success("Bâtiment créé");
        setShowCreate(false);
        setForm({ nom: "", description: "", zoneClimatique: ZONES[0] ?? "H1a" });
        await load();
      }
    } catch (err) {
      showNetworkError(err);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce bâtiment et toutes ses zones ?")) return;
    try {
      const res = await fetch(`/api/batiments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res);
      } else {
        toast.success("Bâtiment supprimé");
        await load();
      }
    } catch (err) {
      showNetworkError(err);
    }
  }

  if (migrationPending) {
    return (
      <div className="p-6 max-w-3xl">
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-700" />
            <CardTitle className="text-amber-900">Migration requise</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900">
            <p>Les tables de zoning n&apos;existent pas encore dans la base.</p>
            <p className="mt-2 font-mono text-xs bg-white p-2 rounded border border-amber-200">
              prisma/migrations/_manual/2026_04_28_add_zoning_thermique.sql
            </p>
            <p className="mt-2">
              Exécute ce fichier SQL dans Supabase puis lance{" "}
              <code>npx prisma generate</code>, puis{" "}
              <code>POST /api/admin/seed-scenarios</code> pour les presets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Bâtiments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Décomposez vos bâtiments en zones thermiques pour le calcul des
            besoins de chauffage et de climatisation.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bâtiment
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouveau bâtiment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3 max-w-xl">
              <div>
                <label className="text-sm font-medium">Nom</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="Siège social Lyon"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium">Zone climatique</label>
                <select
                  value={form.zoneClimatique}
                  onChange={(e) => setForm({ ...form, zoneClimatique: e.target.value })}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucun bâtiment.</p>
            <p className="text-sm mt-1">Créez-en un pour démarrer le zoning thermique.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <Link
                    href={`/dashboard/batiments/${b.id}`}
                    className="font-semibold hover:underline"
                  >
                    {b.nom}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="text-muted-foreground hover:text-red-600"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {b.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {b.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline">{b.zoneClimatique}</Badge>
                  <Badge variant="secondary">
                    {b.zonesCount} zone{b.zonesCount > 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
