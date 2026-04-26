"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Briefcase, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

type ProjetStatut =
  | "EN_ATTENTE"
  | "EN_COURS"
  | "EN_PAUSE"
  | "TERMINE"
  | "ANNULE";

interface KanbanProjet {
  id: string;
  titre: string;
  statut: ProjetStatut;
  typeTravaux: string | null;
  budgetPrevu: number | null;
  updatedAt: string;
  client: { id: string; nom: string; prenom: string | null };
}

interface Props {
  projets: KanbanProjet[];
  onStatutChange: (id: string, statut: ProjetStatut) => void;
}

const COLUMNS: { statut: ProjetStatut; label: string; accent: string }[] = [
  { statut: "EN_ATTENTE", label: "En attente", accent: "bg-amber-400" },
  { statut: "EN_COURS", label: "En cours", accent: "bg-blue-400" },
  { statut: "EN_PAUSE", label: "En pause", accent: "bg-orange-400" },
  { statut: "TERMINE", label: "Terminé", accent: "bg-emerald-400" },
  { statut: "ANNULE", label: "Annulé", accent: "bg-red-400" },
];

function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function clientName(c: KanbanProjet["client"]): string {
  return c.prenom ? `${c.prenom} ${c.nom}` : c.nom;
}

// ─── Card ────────────────────────────────────────────────────────

function ProjetCard({ projet, dragging }: { projet: KanbanProjet; dragging?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-tk-border bg-tk-surface p-3 shadow-sm transition-shadow",
        dragging ? "shadow-lg ring-2 ring-primary/30" : "hover:shadow-md"
      )}
    >
      <div className="mb-1.5 flex items-start gap-1.5">
        <FolderKanban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tk-text-faint" />
        <p className="line-clamp-2 text-sm font-medium leading-snug text-tk-text">
          {projet.titre}
        </p>
      </div>
      {projet.typeTravaux && (
        <span className="mb-2 inline-flex rounded-full bg-tk-hover px-2 py-0.5 text-[10px] text-tk-text-muted">
          {projet.typeTravaux}
        </span>
      )}
      <p className="mb-1 flex items-center gap-1 text-[11px] text-tk-text-faint">
        <Briefcase className="h-2.5 w-2.5" />
        {clientName(projet.client)}
      </p>
      <div className="flex items-center justify-between text-[11px] text-tk-text-muted">
        <span className="font-medium">{formatCurrency(projet.budgetPrevu)}</span>
        <span className="tabular-nums text-tk-text-faint">
          {formatDate(projet.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function DraggableCard({ projet }: { projet: KanbanProjet }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: projet.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0 : 1 }}
      className="cursor-grab active:cursor-grabbing"
    >
      <Link
        href={`/dashboard/projets/${projet.id}`}
        onClick={(e) => {
          // Empêche la nav lors d'un drag réel — dnd-kit prévient déjà le click
          // mais on protège tout de même.
          if (isDragging) e.preventDefault();
        }}
        className="block focus:outline-none"
      >
        <ProjetCard projet={projet} />
      </Link>
    </div>
  );
}

// ─── Column ──────────────────────────────────────────────────────

function Column({
  statut,
  label,
  accent,
  projets,
}: {
  statut: ProjetStatut;
  label: string;
  accent: string;
  projets: KanbanProjet[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: statut });

  return (
    <div className="flex min-w-[260px] flex-1 flex-col rounded-2xl border border-tk-border bg-tk-surface/50">
      <div className="flex items-center justify-between border-b border-tk-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", accent)} />
          <p className="text-sm font-semibold text-tk-text">{label}</p>
        </div>
        <span className="rounded-full bg-tk-hover px-2 py-0.5 text-[11px] font-medium text-tk-text-muted">
          {projets.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 p-2 transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        {projets.length === 0 ? (
          <p className="px-2 py-6 text-center text-[11px] text-tk-text-faint">
            Aucun projet
          </p>
        ) : (
          projets.map((p) => <DraggableCard key={p.id} projet={p} />)
        )}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────

export default function ProjetsKanban({ projets, onStatutChange }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const grouped = useMemo(() => {
    const map: Record<ProjetStatut, KanbanProjet[]> = {
      EN_ATTENTE: [],
      EN_COURS: [],
      EN_PAUSE: [],
      TERMINE: [],
      ANNULE: [],
    };
    for (const p of projets) {
      map[p.statut]?.push(p);
    }
    return map;
  }, [projets]);

  const activeProjet = useMemo(
    () => projets.find((p) => p.id === activeId) ?? null,
    [projets, activeId]
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    const projet = projets.find((p) => p.id === id);
    if (!projet) return;
    const newStatut = overId as ProjetStatut;
    if (!COLUMNS.some((c) => c.statut === newStatut)) return;
    if (projet.statut === newStatut) return;

    // Optimistic
    const previousStatut = projet.statut;
    onStatutChange(id, newStatut);

    try {
      const res = await fetch(`/api/projets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (!res.ok) {
        // rollback
        onStatutChange(id, previousStatut);
        await showApiError(res, "Changement de statut impossible");
        return;
      }
      toast.success("Statut mis à jour");
    } catch (err) {
      onStatutChange(id, previousStatut);
      showNetworkError(err, "Changement de statut impossible");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <Column
            key={col.statut}
            statut={col.statut}
            label={col.label}
            accent={col.accent}
            projets={grouped[col.statut]}
          />
        ))}
      </div>
      <DragOverlay>
        {activeProjet ? (
          <div className="w-[260px]">
            <ProjetCard projet={activeProjet} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
