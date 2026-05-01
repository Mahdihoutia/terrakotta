import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Endpoint de diagnostic — révèle l'état réel de la connexion DB
 * vs ce que le client Prisma "pense" voir.
 *
 * À supprimer une fois le bug résolu.
 */
export async function GET() {
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelDeploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  };

  // 1. Quel host la connexion utilise réellement ?
  const dbUrl = process.env.DATABASE_URL ?? "";
  try {
    const u = new URL(dbUrl);
    result.dbHost = u.hostname;
    result.dbPort = u.port;
    result.dbName = u.pathname.replace("/", "");
    result.dbUserPrefix = u.username.split(".")[0]; // "postgres" sans le project ref
    result.dbProjectRef = u.username.split(".")[1] ?? null;
  } catch {
    result.dbUrlParseError = true;
  }

  // 2. Quels modèles Prisma client connaît ?
  const dmmf = (prisma as unknown as { _baseDmmf?: { datamodel?: { models: Array<{ name: string }> } } })._baseDmmf;
  if (dmmf?.datamodel?.models) {
    result.knownModels = dmmf.datamodel.models.map((m) => m.name).sort();
  }

  // 3. Test SQL brut : current_schema, search_path, count materiaux
  try {
    const rows: Array<{ current_schema: string; current_database: string; search_path: string }> =
      await prisma.$queryRawUnsafe(
        `SELECT current_schema()::text AS current_schema,
                current_database()::text AS current_database,
                current_setting('search_path')::text AS search_path`,
      );
    result.serverInfo = rows[0];
  } catch (err) {
    result.serverInfoError = err instanceof Error ? err.message : String(err);
  }

  // 4. Liste les tables présentes dans le schéma public
  try {
    const tables: Array<{ tablename: string }> = await prisma.$queryRawUnsafe(
      `SELECT tablename::text FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    );
    result.publicTables = tables.map((t) => t.tablename);
    result.materiauxExists = tables.some((t) => t.tablename === "materiaux");
    result.paroisExists = tables.some((t) => t.tablename === "parois");
  } catch (err) {
    result.publicTablesError = err instanceof Error ? err.message : String(err);
  }

  // 5. Test direct via Prisma client (le test qui échoue dans /api/materiaux)
  try {
    const count = await prisma.materiau.count();
    result.prismaMateriauCount = count;
  } catch (err) {
    result.prismaMateriauError = err instanceof Error ? err.message : String(err);
    result.prismaMateriauErrorCode = (err as { code?: string })?.code ?? null;
  }

  return NextResponse.json(result, { status: 200 });
}
