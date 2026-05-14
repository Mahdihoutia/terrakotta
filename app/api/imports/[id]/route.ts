import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const imp = await prisma.import.findUnique({ where: { id } });
  if (!imp) {
    return NextResponse.json({ error: "Import introuvable" }, { status: 404 });
  }
  return NextResponse.json({
    id: imp.id,
    entity: imp.entity,
    status: imp.status,
    totalRows: imp.totalRows,
    processedRows: imp.processedRows,
    importedRows: imp.importedRows,
    skippedRows: imp.skippedRows,
    errorRows: imp.errorRows,
    errorsJson: imp.errorsJson,
    startedAt: imp.startedAt,
    finishedAt: imp.finishedAt,
    createdAt: imp.createdAt,
  });
}
