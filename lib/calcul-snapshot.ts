/**
 * Snapshots immuables — règle d'or : on ne recalcule jamais en place.
 *
 * Chaque exécution du moteur produit un Calcul (inputs JSON + outputs JSON
 * + version moteur + version barèmes). Permet :
 *   - rejouabilité : on peut comparer un calcul de janvier à un calcul de juin
 *     même si les barèmes ou le moteur ont changé.
 *   - audit trail : un rapport PDF référence un calcul daté et signé.
 *   - debugging : on peut reproduire un calcul avec ses inputs exacts.
 */

import { prisma } from "./db";
import type { CalculType } from "@prisma/client";
import { BAREMES_VERSION } from "./aides";

/** Version du moteur thermique — incrémenter sur changement formule. */
export const MOTEUR_THERMIQUE_VERSION = "thermal@2026-05-04";

interface CreateCalculInput {
  projetId: string;
  varianteId?: string | null;
  type: CalculType;
  inputs: unknown;
  outputs: unknown;
  notes?: string;
  /** Override la version du moteur (utile pour aides, qui utilise BAREMES_VERSION). */
  moteurVersion?: string;
  /** Pour les calculs aides — version barèmes utilisée. */
  baremesVersion?: string;
}

/** Persiste un calcul immutable. Le résultat n'est jamais modifié.
 *
 * Bump `projet.updatedAt` dans la même transaction afin que la liste
 * projets (triée `updatedAt desc`) remonte les projets fraîchement
 * recalculés — un export PDF, une exécution moteur ou un calcul d'aides
 * comptent comme une activité utilisateur. */
export async function snapshotCalcul(input: CreateCalculInput) {
  const [calcul] = await prisma.$transaction([
    prisma.calcul.create({
      data: {
        projetId: input.projetId,
        varianteId: input.varianteId ?? null,
        type: input.type,
        inputsJson: JSON.stringify(input.inputs),
        outputsJson: JSON.stringify(input.outputs),
        moteurVersion: input.moteurVersion ?? MOTEUR_THERMIQUE_VERSION,
        baremesVersion: input.baremesVersion ?? null,
        notes: input.notes ?? null,
      },
      select: {
        id: true, type: true, moteurVersion: true, baremesVersion: true,
        createdAt: true,
      },
    }),
    prisma.projet.update({
      where: { id: input.projetId },
      data: { updatedAt: new Date() },
      select: { id: true },
    }),
  ]);
  return calcul;
}

/** Persiste un calcul aides — utilise BAREMES_VERSION par défaut. */
export async function snapshotAides(
  projetId: string,
  varianteId: string | null,
  inputs: unknown,
  outputs: unknown,
  notes?: string,
) {
  return snapshotCalcul({
    projetId,
    varianteId,
    type: "AIDES",
    inputs,
    outputs,
    notes,
    moteurVersion: `aides@${BAREMES_VERSION}`,
    baremesVersion: BAREMES_VERSION,
  });
}

/** Récupère le dernier calcul d'un type donné pour un projet (sans deserialize). */
export async function getLatestCalcul(
  projetId: string,
  type: CalculType,
  varianteId?: string | null,
) {
  return prisma.calcul.findFirst({
    where: { projetId, type, varianteId: varianteId ?? undefined },
    orderBy: { createdAt: "desc" },
  });
}

/** Désérialise inputs/outputs d'un calcul (lecture). */
export function readCalcul<I = unknown, O = unknown>(c: {
  inputsJson: string;
  outputsJson: string;
}): { inputs: I; outputs: O } {
  return {
    inputs: JSON.parse(c.inputsJson) as I,
    outputs: JSON.parse(c.outputsJson) as O,
  };
}
