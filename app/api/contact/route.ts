import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { CONTACT_EMAIL, EMAIL_FROM, getResend } from "@/lib/email/resend";
import { ackEmail, notificationEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

const schema = z.object({
  nom: z.string().min(1).max(120),
  prenom: z.string().max(120).optional(),
  email: z.string().email(),
  telephone: z.string().max(40).optional(),
  raisonSociale: z.string().max(200).optional(),
  fonction: z.string().max(120).optional(),
  typeProjet: z.string().max(120).optional(),
  message: z.string().min(10).max(5000),
  website: z.string().optional(), // honeypot
});

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;
const buckets = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    buckets.set(ip, arr);
    return true;
  }
  arr.push(now);
  buckets.set(ip, arr);
  return false;
}

function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ValidationError", issues: parsed.error.issues }, { status: 422 });
  }
  const data = parsed.data;

  // Honeypot — bots remplissent souvent les champs cachés
  if (data.website && data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (rateLimited(getIp(req))) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez plus tard." }, { status: 429 });
  }

  const notes = [
    data.typeProjet ? `Type de projet : ${data.typeProjet}` : "",
    data.message,
  ]
    .filter(Boolean)
    .join("\n\n");

  let leadId: string | undefined;
  try {
    const lead = await prisma.lead.create({
      data: {
        nom: data.nom,
        prenom: data.prenom || null,
        email: data.email,
        telephone: data.telephone || null,
        raisonSociale: data.raisonSociale || null,
        fonction: data.fonction || null,
        source: "SITE_WEB",
        statut: "NOUVEAU",
        notes,
      },
      select: { id: true },
    });
    leadId = lead.id;
  } catch (e) {
    console.error("[/api/contact] DB error", e);
    // On continue : on essaye quand même d'envoyer l'email pour ne pas perdre le contact
  }

  const payload = { ...data, leadId };

  try {
    const resend = getResend();
    const notif = notificationEmail(payload);
    const ack = ackEmail(payload);

    await Promise.all([
      resend.emails.send({
        from: EMAIL_FROM,
        to: CONTACT_EMAIL,
        replyTo: data.email,
        subject: notif.subject,
        html: notif.html,
        text: notif.text,
      }),
      resend.emails.send({
        from: EMAIL_FROM,
        to: data.email,
        replyTo: CONTACT_EMAIL,
        subject: ack.subject,
        html: ack.html,
        text: ack.text,
      }),
    ]);
  } catch (e) {
    console.error("[/api/contact] Email error", e);
    if (!leadId) {
      return NextResponse.json({ error: "Envoi impossible. Réessayez plus tard." }, { status: 500 });
    }
    // Lead enregistré mais email KO : on renvoie OK quand même (lead visible dans dashboard)
  }

  return NextResponse.json({ ok: true, leadId }, { status: 201 });
}
