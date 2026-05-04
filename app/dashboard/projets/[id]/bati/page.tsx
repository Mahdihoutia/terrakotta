import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ExternalLink, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import BatimentCreateDialog from "@/components/dashboard/BatimentCreateDialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BatiTabPage({ params }: Props) {
  const { id } = await params;
  const projet = await prisma.projet.findUnique({
    where: { id },
    select: { id: true, titre: true, adresseChantier: true },
  });
  if (!projet) notFound();

  const batiments = await prisma.batiment.findMany({
    where: { projetId: id, deletedAt: null },
    select: {
      id: true,
      nom: true,
      description: true,
      zoneClimatique: true,
      altitude: true,
      orientation: true,
      zones: {
        select: { id: true, nom: true, usage: true, surface: true, hauteurSousPlafond: true },
      },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalZones = batiments.reduce((s, b) => s + b.zones.length, 0);
  const totalSurface = batiments.reduce(
    (s, b) => s + b.zones.reduce((zs, z) => zs + Number(z.surface), 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="section-title-dense">Bâti</h1>
          <p className="text-[13px] text-tk-text-muted">
            {batiments.length === 0
              ? "Aucun bâtiment encore créé pour ce projet."
              : `${batiments.length} bâtiment${batiments.length > 1 ? "s" : ""} · ${totalZones} zone${totalZones > 1 ? "s" : ""} · ${totalSurface.toFixed(0)} m²`}
          </p>
        </div>
        <BatimentCreateDialog projetId={id} />
      </div>

      {batiments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-tk-border bg-tk-surface/40 p-10 text-center">
          <Building2 className="mx-auto h-7 w-7 text-tk-text-faint/60" />
          <p className="mt-3 text-[13px] font-medium text-tk-text">Pas encore de bâtiment</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-tk-text-muted">
            Crée un bâtiment dans le module Bâtiments — zone climatique, altitude, orientation
            puis découpage en zones thermiques (chauffées, non chauffées, mixtes).
          </p>
          {projet.adresseChantier && (
            <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-tk-text-faint">
              <MapPin className="h-3 w-3" />
              Adresse projet : {projet.adresseChantier}
            </p>
          )}
          <div className="mt-5">
            <BatimentCreateDialog projetId={id} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {batiments.map((b) => {
            const surfaceB = b.zones.reduce((s, z) => s + Number(z.surface), 0);
            return (
              <section
                key={b.id}
                className="overflow-hidden rounded-lg border border-tk-border bg-tk-surface"
              >
                <header className="flex items-center justify-between gap-3 border-b border-tk-border bg-tk-bg/40 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-tk-text-faint" />
                      <h2 className="truncate text-[14px] font-semibold text-tk-text">{b.nom}</h2>
                      <span className="rounded border border-tk-border bg-tk-bg/40 px-1.5 py-0.5 text-[10px] font-mono text-tk-text-muted">
                        {b.zoneClimatique}
                      </span>
                    </div>
                    {b.description && (
                      <p className="mt-0.5 truncate text-[11px] text-tk-text-muted">{b.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-tk-text-faint">
                      <span>{b.zones.length} zone{b.zones.length > 1 ? "s" : ""}</span>
                      <span className="text-tk-border">·</span>
                      <span className="font-mono tabular-nums">{surfaceB.toFixed(0)} m²</span>
                      {b.altitude && (
                        <>
                          <span className="text-tk-border">·</span>
                          <span>Alt. {Number(b.altitude).toFixed(0)} m</span>
                        </>
                      )}
                      {b.orientation && (
                        <>
                          <span className="text-tk-border">·</span>
                          <span>Orient. {b.orientation}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/batiments/${b.id}`}
                    aria-label="Ouvrir le bâtiment"
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-tk-text-faint hover:bg-tk-hover hover:text-tk-text"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </header>

                {b.zones.length === 0 ? (
                  <p className="px-4 py-4 text-[12px] text-tk-text-muted">
                    Pas de zone définie. Découpe ce bâtiment en zones thermiques pour activer le calcul.
                  </p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Zone</th>
                        <th>Usage</th>
                        <th className="num">Surface</th>
                        <th className="num">HSP</th>
                        <th className="num">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b.zones.map((z) => {
                        const surface = Number(z.surface);
                        const hsp = Number(z.hauteurSousPlafond);
                        return (
                          <tr key={z.id}>
                            <td className="font-medium text-tk-text">{z.nom}</td>
                            <td className="text-tk-text-muted">{z.usage.replace(/_/g, " ").toLowerCase()}</td>
                            <td className="num font-mono">{surface.toFixed(1)} m²</td>
                            <td className="num font-mono">{hsp.toFixed(2)} m</td>
                            <td className="num font-mono">{(surface * hsp).toFixed(0)} m³</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
