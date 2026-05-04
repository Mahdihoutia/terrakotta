import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ClipboardCheck,
  Ruler,
  Calculator,
  FileText,
  Activity,
  Plus,
  ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

type DocType = "RAPPORT_VISITE" | "NOTE_DIMENSIONNEMENT" | "DEVIS" | "AUDIT" | "BILAN_THERMIQUE";
type DocStatut = "BROUILLON" | "EN_COURS" | "TERMINE" | "ENVOYE";

const TYPE_META: Record<DocType, { label: string; icon: React.ComponentType<{ className?: string }>; href: string; color: string }> = {
  RAPPORT_VISITE: { label: "Rapport de visite", icon: ClipboardCheck, href: "/dashboard/documents?type=RAPPORT_VISITE", color: "text-sky-500" },
  NOTE_DIMENSIONNEMENT: { label: "Note de dimensionnement", icon: Ruler, href: "/dashboard/documents?type=NOTE_DIMENSIONNEMENT", color: "text-violet-500" },
  DEVIS: { label: "Devis", icon: Calculator, href: "/dashboard/devis", color: "text-emerald-500" },
  AUDIT: { label: "Audit énergétique", icon: FileText, href: "/dashboard/audit", color: "text-amber-500" },
  BILAN_THERMIQUE: { label: "Bilan thermique", icon: Activity, href: "/dashboard/bilan-thermique", color: "text-blue-500" },
};

const STATUT_META: Record<DocStatut, { label: string; class: string }> = {
  BROUILLON: { label: "Brouillon", class: "bg-slate-500/15 text-slate-500 border-slate-500/20" },
  EN_COURS: { label: "En cours", class: "bg-blue-500/15 text-blue-500 border-blue-500/20" },
  TERMINE: { label: "Terminé", class: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  ENVOYE: { label: "Envoyé", class: "bg-violet-500/15 text-violet-500 border-violet-500/20" },
};

const TYPES_ORDRE: DocType[] = ["RAPPORT_VISITE", "BILAN_THERMIQUE", "AUDIT", "NOTE_DIMENSIONNEMENT", "DEVIS"];

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LivrablesTabPage({ params }: Props) {
  const { id } = await params;
  const projet = await prisma.projet.findUnique({
    where: { id },
    select: { id: true, titre: true },
  });
  if (!projet) notFound();

  const documents = await prisma.document.findMany({
    where: { projetId: id, deletedAt: null },
    select: {
      id: true,
      titre: true,
      reference: true,
      type: true,
      statut: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Group by type
  const groups = new Map<DocType, typeof documents>();
  for (const t of TYPES_ORDRE) groups.set(t, []);
  for (const d of documents) {
    const arr = groups.get(d.type as DocType);
    if (arr) arr.push(d);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="section-title-dense">Livrables</h1>
          <p className="text-[13px] text-tk-text-muted">
            {documents.length === 0
              ? "Aucun document encore rattaché à ce projet."
              : `${documents.length} document${documents.length > 1 ? "s" : ""} rattaché${documents.length > 1 ? "s" : ""} — ${countByStatut(documents, "TERMINE") + countByStatut(documents, "ENVOYE")} finalisé${countByStatut(documents, "TERMINE") + countByStatut(documents, "ENVOYE") > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-1.5 rounded-md border border-tk-border bg-tk-surface px-3 py-1.5 text-[12px] font-medium text-tk-text-secondary hover:border-tk-border-hover hover:text-tk-text"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouveau document
        </Link>
      </div>

      {/* Synthèse par type */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TYPES_ORDRE.map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const docs = groups.get(type) ?? [];
          const finalises = docs.filter((d) => d.statut === "TERMINE" || d.statut === "ENVOYE").length;
          return (
            <div key={type} className="rounded-lg border border-tk-border bg-tk-surface p-3">
              <div className="flex items-center justify-between">
                <Icon className={cn("h-4 w-4", meta.color)} />
                <span className="text-[10px] uppercase tracking-wider text-tk-text-faint">
                  {finalises}/{docs.length}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-medium text-tk-text leading-tight">{meta.label}</p>
            </div>
          );
        })}
      </div>

      {/* Listings par type */}
      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-tk-border bg-tk-surface/40 p-10 text-center">
          <FileText className="mx-auto h-7 w-7 text-tk-text-faint/60" />
          <p className="mt-3 text-[13px] font-medium text-tk-text">Pas encore de livrable</p>
          <p className="mt-1 text-[12px] text-tk-text-muted max-w-sm mx-auto">
            Crée un rapport de visite, un audit ou un devis depuis les modules dédiés — il sera automatiquement rattaché à ce projet.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {TYPES_ORDRE.map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              return (
                <Link
                  key={t}
                  href={meta.href}
                  className="inline-flex items-center gap-1.5 rounded-md border border-tk-border bg-tk-surface px-3 py-1.5 text-[12px] text-tk-text-secondary hover:border-tk-border-hover hover:text-tk-text"
                >
                  <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                  {meta.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {TYPES_ORDRE.map((type) => {
            const docs = groups.get(type) ?? [];
            if (docs.length === 0) return null;
            const meta = TYPE_META[type];
            const Icon = meta.icon;
            return (
              <section key={type}>
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                  <h2 className="text-[12px] font-semibold uppercase tracking-wider text-tk-text-muted">
                    {meta.label}
                  </h2>
                  <span className="text-[11px] text-tk-text-faint">{docs.length}</span>
                </div>
                <div className="overflow-hidden rounded-lg border border-tk-border bg-tk-surface">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Référence</th>
                        <th>Titre</th>
                        <th>Statut</th>
                        <th className="num">Modifié</th>
                        <th className="col-narrow"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((d) => {
                        const statutMeta = STATUT_META[d.statut as DocStatut];
                        return (
                          <tr key={d.id}>
                            <td className="font-mono text-tk-text-muted">{d.reference}</td>
                            <td className="font-medium text-tk-text">{d.titre}</td>
                            <td>
                              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", statutMeta.class)}>
                                {statutMeta.label}
                              </span>
                            </td>
                            <td className="num text-tk-text-muted">{formatDate(d.updatedAt)}</td>
                            <td className="col-narrow text-right">
                              <Link
                                href={`${meta.href}${meta.href.includes("?") ? "&" : "?"}doc=${d.id}`}
                                aria-label="Ouvrir"
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-tk-text-faint hover:bg-tk-hover hover:text-tk-text"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function countByStatut(docs: { statut: string }[], statut: string): number {
  return docs.filter((d) => d.statut === statut).length;
}
