import { Info, ChevronDown, Gauge } from "lucide-react";
import Link from "next/link";

interface Props {
  /** Phrase courte décrivant la méthode de calcul de l'onglet. */
  methode: string;
  /** Marge / précision annoncée (ex. "±10 %", "calage <5 %"). */
  precision: string;
  /** Détails de ce qui est calculé (puces). */
  points?: string[];
  /** Lien optionnel pour affiner via la calibration ERA5 du projet. */
  calibrationHref?: string;
  /** Ouvert par défaut ? (false = replié) */
  defaultOpen?: boolean;
}

/**
 * Bloc explicatif « Méthode & précision » à poser en tête d'un onglet de
 * calcul. Rend la méthode transparente (comment c'est calculé, avec quelle
 * marge) et oriente vers la calibration ERA5 pour un calage sur consos réelles.
 *
 * Server-compatible : utilise <details> natif, aucun JS client.
 */
export default function MethodeInfo({
  methode,
  precision,
  points,
  calibrationHref,
  defaultOpen = false,
}: Props) {
  return (
    <details
      open={defaultOpen}
      className="rounded-lg border border-tk-border bg-tk-surface/60"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-[12px] font-medium text-tk-text-secondary hover:text-tk-text">
        <Info className="h-3.5 w-3.5 text-tk-primary" />
        Méthode &amp; précision
        <span className="ml-1 rounded-full border border-tk-border bg-tk-bg/50 px-2 py-0.5 text-[10px] font-normal text-tk-text-muted">
          {precision}
        </span>
        <ChevronDown className="ml-auto h-3.5 w-3.5 text-tk-text-faint transition-transform [[open]_&]:rotate-180" />
      </summary>
      <div className="space-y-2 border-t border-tk-border px-4 py-3 text-[12px] leading-relaxed text-tk-text-muted">
        <p>{methode}</p>
        {points && points.length > 0 && (
          <ul className="ml-4 list-disc space-y-0.5">
            {points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
        {calibrationHref && (
          <Link
            href={calibrationHref}
            className="inline-flex items-center gap-1.5 rounded-md border border-tk-primary/30 bg-tk-primary/10 px-2.5 py-1 text-[11px] font-medium text-tk-primary hover:bg-tk-primary/20"
          >
            <Gauge className="h-3 w-3" />
            Affiner sur consos réelles (Calibration ERA5)
          </Link>
        )}
      </div>
    </details>
  );
}
