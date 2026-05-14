import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { processContactImport } from "@/lib/imports/processor/contact";

const MAX_ROWS = 1000;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    filename?: string;
    mapping?: Record<string, string | null>;
    rows?: Record<string, unknown>[];
  };
  const { filename, mapping, rows } = body;
  if (!filename || !mapping || !Array.isArray(rows)) {
    return NextResponse.json(
      { error: "Payload invalide (filename, mapping, rows)" },
      { status: 400 }
    );
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne à importer" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ROWS} lignes par import` },
      { status: 422 }
    );
  }

  const imp = await prisma.import.create({
    data: {
      entity: "CONTACT",
      filename,
      status: "PENDING",
      totalRows: rows.length,
      mappingJson: mapping as unknown as object,
      rowsJson: rows as unknown as object,
    },
  });

  // `after()` est stable depuis Next 15.1 (cf. node_modules/next/dist/docs/.../after.md)
  after(async () => {
    await processContactImport(imp.id);
  });

  return NextResponse.json({ importId: imp.id });
}
