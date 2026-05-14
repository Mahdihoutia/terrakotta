import { prisma } from "@/lib/db";
import { ContactImportRow } from "@/lib/imports/schemas/contact";

interface ImportError {
  row: number;
  field: string;
  message: string;
}

/**
 * Traite un import contact : lit Import.rowsJson, valide chaque ligne via Zod,
 * dédupe par email (skip), crée les contacts dans Client.
 * Maj progress toutes les 25 lignes pour limiter les writes Postgres.
 */
export async function processContactImport(importId: string): Promise<void> {
  const imp = await prisma.import.findUnique({ where: { id: importId } });
  if (!imp || !imp.rowsJson) return;

  const rows = imp.rowsJson as Record<string, unknown>[];
  const errors: ImportError[] = Array.isArray(imp.errorsJson)
    ? (imp.errorsJson as unknown as ImportError[])
    : [];

  await prisma.import.update({
    where: { id: importId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  let processed = 0;
  let imported = 0;
  let skipped = 0;
  let errorCount = 0;

  try {
    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const parsed = ContactImportRow.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({
            row: i + 2, // +2 : ligne 1 = headers, index 0 = row 2 dans le fichier
            field: issue.path.join(".") || "_root",
            message: issue.message,
          });
        }
        errorCount++;
      } else {
        const data = parsed.data;
        let isDup = false;
        if (data.email) {
          const existing = await prisma.client.findFirst({
            where: { email: data.email, deletedAt: null },
            select: { id: true },
          });
          if (existing) isDup = true;
        }
        if (isDup) {
          skipped++;
        } else {
          await prisma.client.create({
            data: {
              nom: data.nom,
              prenom: data.prenom ?? null,
              email: data.email ?? null,
              telephone: data.telephone ?? null,
              raisonSociale: data.raisonSociale ?? null,
              fonction: data.fonction ?? null,
              notes: data.notes ?? null,
              type: data.raisonSociale ? "PROFESSIONNEL" : "PARTICULIER",
            },
          });
          imported++;
        }
      }
      processed++;

      if (processed % 25 === 0) {
        await prisma.import.update({
          where: { id: importId },
          data: {
            processedRows: processed,
            importedRows: imported,
            skippedRows: skipped,
            errorRows: errorCount,
            errorsJson: errors as unknown as object,
          },
        });
      }
    }

    await prisma.import.update({
      where: { id: importId },
      data: {
        status: "DONE",
        processedRows: processed,
        importedRows: imported,
        skippedRows: skipped,
        errorRows: errorCount,
        errorsJson: errors as unknown as object,
        rowsJson: undefined, // libère le payload
        finishedAt: new Date(),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    errors.push({ row: -1, field: "_root", message });
    await prisma.import.update({
      where: { id: importId },
      data: {
        status: "FAILED",
        processedRows: processed,
        importedRows: imported,
        skippedRows: skipped,
        errorRows: errorCount,
        errorsJson: errors as unknown as object,
        finishedAt: new Date(),
      },
    });
  }
}
