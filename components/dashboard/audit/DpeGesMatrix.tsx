"use client";

/**
 * DpeGesMatrix — Carte de chaleur officielle DPE × GES (Arrêté 31 mars 2021).
 *
 * Affiche la grille 7×7 où chaque cellule [DPE, GES] est colorée selon
 * l'étiquette finale = max(DPE, GES). Permet de positionner un état actuel
 * et un état projeté avec une flèche entre les deux.
 */

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type Letter = "A" | "B" | "C" | "D" | "E" | "F" | "G";

const LETTERS: Letter[] = ["A", "B", "C", "D", "E", "F", "G"];

/** Couleurs officielles Arrêté 31 mars 2021 (DPE / GES). */
export const LETTER_COLORS: Record<Letter, string> = {
  A: "#00A03C",
  B: "#51B237",
  C: "#BCCF22",
  D: "#F1ED00",
  E: "#FCB100",
  F: "#E55F1B",
  G: "#D8001C",
};

const LETTER_DESCRIPTIONS: Record<Letter, string> = {
  A: "A — Très performant",
  B: "B — Performant",
  C: "C — Assez performant",
  D: "D — Moyennement performant",
  E: "E — Peu performant",
  F: "F — Mauvais",
  G: "G — Extrêmement énergivore",
};

/** Cellules avec fond foncé → texte blanc. */
const DARK_CELLS = new Set<Letter>(["A", "F", "G"]);

interface DpeGesMatrixProps {
  dpeActuel: Letter;
  gesActuel: Letter;
  dpeProjete?: Letter;
  gesProjete?: Letter;
  size?: "sm" | "md";
}

/**
 * Parse une lettre DPE/GES depuis une chaîne du form ("C — 111 à 180" → "C").
 */
export function parseDpeLetter(s: string | undefined | null): Letter | null {
  if (!s) return null;
  const ch = s.trim().charAt(0).toUpperCase();
  if (LETTERS.includes(ch as Letter)) return ch as Letter;
  return null;
}

/** Retourne la lettre finale = max(dpe, ges). */
function finalLetter(dpe: Letter, ges: Letter): Letter {
  const idx = Math.max(LETTERS.indexOf(dpe), LETTERS.indexOf(ges));
  return LETTERS[idx];
}

export default function DpeGesMatrix({
  dpeActuel,
  gesActuel,
  dpeProjete,
  gesProjete,
  size = "md",
}: DpeGesMatrixProps) {
  const cellSize = size === "sm" ? 26 : 36;
  const labelSize = size === "sm" ? 18 : 22;

  return (
    <TooltipProvider>
      <div className="rounded-md border bg-background p-4">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Carte de chaleur DPE × GES
          </p>
          <p className="text-[10px] text-muted-foreground">
            Étiquette finale = max(DPE, GES) — Arrêté 31 mars 2021
          </p>
        </div>

        <div className="flex items-start gap-4">
          {/* Matrice */}
          <div className="inline-block">
            {/* Header GES (colonnes) */}
            <div
              className="flex"
              style={{ marginLeft: labelSize + 4 }}
              aria-hidden
            >
              <div
                className="flex items-center justify-center"
                style={{ width: cellSize * 7, height: labelSize }}
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  GES (kgCO₂eq/m²·an) →
                </span>
              </div>
            </div>
            <div className="flex" style={{ marginLeft: labelSize + 4 }}>
              {LETTERS.map((g) => (
                <div
                  key={`h-${g}`}
                  className="flex items-center justify-center text-[10px] font-bold text-muted-foreground"
                  style={{ width: cellSize, height: labelSize }}
                >
                  {g}
                </div>
              ))}
            </div>

            {/* Lignes DPE */}
            {LETTERS.map((d) => (
              <div key={`row-${d}`} className="flex items-center">
                {/* Label DPE (lignes) */}
                <div
                  className="flex items-center justify-center text-[10px] font-bold text-muted-foreground"
                  style={{ width: labelSize, height: cellSize }}
                >
                  {d}
                </div>
                <div className="w-1" />
                {LETTERS.map((g) => {
                  const fl = finalLetter(d, g);
                  const isActuel = d === dpeActuel && g === gesActuel;
                  const isProjete =
                    dpeProjete && gesProjete && d === dpeProjete && g === gesProjete;
                  const dark = DARK_CELLS.has(fl);
                  return (
                    <Tooltip key={`c-${d}-${g}`}>
                      <TooltipTrigger
                        aria-label={`DPE ${d}, GES ${g} — étiquette finale ${fl}`}
                        className={cn(
                          "relative flex items-center justify-center transition-transform border-0 cursor-default",
                          (isActuel || isProjete) && "scale-105 z-10",
                        )}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          background: LETTER_COLORS[fl],
                          color: dark ? "#fff" : "#1a1a1a",
                          outline: isActuel
                            ? "2px solid #0D1B35"
                            : isProjete
                            ? "2px dashed #0D1B35"
                            : "1px solid rgba(255,255,255,0.4)",
                          outlineOffset: isActuel || isProjete ? 1 : -1,
                        }}
                      >
                        <span className="text-[9px] font-bold opacity-90">{fl}</span>
                        {isActuel && (
                          <span
                            className="absolute -top-1.5 -right-1.5 rounded-full bg-foreground px-1 py-px text-[8px] font-bold text-background"
                            style={{ lineHeight: 1 }}
                          >
                            Avant
                          </span>
                        )}
                        {isProjete && !isActuel && (
                          <span
                            className="absolute -bottom-1.5 -left-1.5 rounded-full bg-emerald-600 px-1 py-px text-[8px] font-bold text-white"
                            style={{ lineHeight: 1 }}
                          >
                            Après
                          </span>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-[11px] leading-tight">
                          <div className="font-semibold">Étiquette finale : {fl}</div>
                          <div className="text-muted-foreground">
                            DPE {d} · GES {g}
                          </div>
                          <div className="text-muted-foreground">
                            Étiquette finale = max des deux
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}

            {/* Footer DPE legend */}
            <div className="mt-1 flex" style={{ marginLeft: labelSize + 4 }} aria-hidden>
              <div
                className="flex items-center justify-center"
                style={{ width: cellSize * 7, height: labelSize }}
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  ↑ DPE (kWhEP/m²·an)
                </span>
              </div>
            </div>
          </div>

          {/* Légende */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Légende
            </p>
            {LETTERS.map((l) => (
              <div key={l} className="flex items-center gap-2">
                <div
                  className="h-3.5 w-3.5 rounded-sm shrink-0"
                  style={{ background: LETTER_COLORS[l] }}
                />
                <span className="text-[11px] leading-tight">
                  {LETTER_DESCRIPTIONS[l]}
                </span>
              </div>
            ))}

            {dpeProjete && gesProjete && (
              <div className="mt-3 pt-3 border-t flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {finalLetter(dpeActuel, gesActuel)}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
                <span className="font-semibold text-emerald-700">
                  {finalLetter(dpeProjete, gesProjete)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
