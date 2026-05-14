import { NextResponse } from "next/server";
import { parseFile } from "@/lib/imports/parse";
import {
  CONTACT_SCHEMA_FIELDS,
  detectMapping,
} from "@/lib/imports/mapping";
import { ContactImportRow } from "@/lib/imports/schemas/contact";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 5 Mo)" },
      { status: 413 }
    );
  }

  const { headers, rows } = await parseFile(file);
  const detected = detectMapping(headers, [...CONTACT_SCHEMA_FIELDS]);

  const sampleRowsRaw = rows.slice(0, 10);
  const sampleRows = sampleRowsRaw.map((r) => mapRow(r, detected));
  const previewErrors: { row: number; field: string; message: string }[] = [];
  sampleRows.forEach((row, idx) => {
    const parsed = ContactImportRow.safeParse(row);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        previewErrors.push({
          row: idx + 2,
          field: issue.path.join(".") || "_root",
          message: issue.message,
        });
      }
    }
  });

  // `allRows` est utilisé par le client pour committer sans re-parser le fichier.
  // Pour le MVP on plafonne à 1000 lignes (cf. limite côté /commit).
  const allRows = rows.slice(0, 1000).map((r) => mapRow(r, detected));

  return NextResponse.json({
    headers,
    detectedMapping: detected,
    sampleRows,
    allRows,
    totalRows: rows.length,
    previewErrors,
  });
}

function mapRow(
  raw: Record<string, unknown>,
  mapping: Record<string, string | null>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [header, field] of Object.entries(mapping)) {
    if (!field) continue;
    out[field] = raw[header] ?? null;
  }
  return out;
}
