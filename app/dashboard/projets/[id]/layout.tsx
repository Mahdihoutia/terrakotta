import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import ProjetWorkspaceTabs from "@/components/dashboard/ProjetWorkspaceTabs";

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400 dark:border-amber-500/20",
  EN_COURS: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400 dark:border-blue-500/20",
  EN_PAUSE: "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400 dark:border-orange-500/20",
  TERMINE: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 dark:border-emerald-500/20",
  ANNULE: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400 dark:border-red-500/20",
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  EN_PAUSE: "En pause",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ProjetWorkspaceLayout({ children, params }: Props) {
  const { id } = await params;

  const projet = await prisma.projet.findUnique({
    where: { id },
    select: {
      id: true,
      titre: true,
      statut: true,
      typeTravaux: true,
      adresseChantier: true,
      client: { select: { id: true, nom: true, prenom: true } },
    },
  });

  if (!projet) notFound();

  const clientLabel = [projet.client.nom, projet.client.prenom].filter(Boolean).join(" ");

  return (
    <div className="-m-6 lg:-m-8 flex flex-col h-full min-h-[calc(100vh-4rem)]">
      {/* Workspace header — sticky, dense */}
      <header className="sticky top-0 z-20 border-b border-tk-border bg-tk-bg/95 backdrop-blur supports-[backdrop-filter]:bg-tk-bg/80">
        <div className="flex items-center gap-3 px-6 lg:px-8 pt-4 pb-3">
          <Link
            href="/dashboard/projets"
            aria-label="Retour à la liste des projets"
            className="rounded-md p-1.5 text-tk-text-faint transition-colors hover:bg-tk-hover hover:text-tk-text"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[15px] font-semibold text-tk-text">
                {projet.titre}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  STATUT_COLORS[projet.statut] ?? STATUT_COLORS.EN_ATTENTE,
                )}
              >
                {STATUT_LABELS[projet.statut] ?? projet.statut}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-tk-text-faint">
              <Link
                href={`/dashboard/contacts/${projet.client.id}`}
                className="inline-flex items-center gap-1 transition-colors hover:text-tk-text"
              >
                <User className="h-3 w-3" />
                {clientLabel || "Client sans nom"}
              </Link>
              {projet.typeTravaux && (
                <>
                  <span className="text-tk-border">·</span>
                  <span>{projet.typeTravaux}</span>
                </>
              )}
              {projet.adresseChantier && (
                <>
                  <span className="text-tk-border">·</span>
                  <span className="truncate">{projet.adresseChantier}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 lg:px-8 border-b border-tk-border/60">
          <ProjetWorkspaceTabs projetId={projet.id} />
        </div>
      </header>

      {/* Tab content */}
      <div className="flex-1 px-6 lg:px-8 py-6">{children}</div>
    </div>
  );
}
