import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Test la connexion DB
    await prisma.$queryRaw`SELECT 1`;
    const leadCount = await prisma.lead.count();
    const clientCount = await prisma.client.count();

    return NextResponse.json({
      status: "ok",
      database: "connected",
      counts: { leads: leadCount, clients: clientCount },
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
      },
    });
  } catch (error) {
    console.error("[API /api/health]", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown",
        env: {
          hasDbUrl: !!process.env.DATABASE_URL,
          dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
        },
      },
      { status: 500 }
    );
  }
}
