interface ContactPayload {
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  raisonSociale?: string;
  fonction?: string;
  typeProjet?: string;
  message: string;
  leadId?: string;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const dashboardUrl = (leadId: string) => {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kilowater.fr";
  return `${base}/dashboard/leads/${leadId}`;
};

export function notificationEmail(p: ContactPayload) {
  const fullName = [p.prenom, p.nom].filter((v): v is string => Boolean(v)).map(escape).join(" ");
  const rows: Array<[string, string | undefined]> = [
    ["Nom complet", fullName],
    ["Email", p.email],
    ["Téléphone", p.telephone],
    ["Raison sociale", p.raisonSociale],
    ["Fonction", p.fonction],
    ["Type de projet", p.typeProjet],
  ];

  const rowsHtml = rows
    .filter(([, v]) => v && v.trim().length > 0)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 16px 8px 0;color:#64748B;font-size:13px;vertical-align:top;width:140px">${k}</td><td style="padding:8px 0;color:#0D1B35;font-size:14px">${escape(v!)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#F5FAFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="background:white;border:1px solid #DBEAFE;padding:32px">
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#2563EB">Nouveau lead — Site web</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:500;color:#0D1B35">${fullName}</h1>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #E5EEFB">${rowsHtml}</table>
    <div style="margin-top:24px;padding-top:24px;border-top:1px solid #E5EEFB">
      <p style="margin:0 0 8px;font-size:13px;color:#64748B">Message</p>
      <div style="white-space:pre-wrap;font-size:14px;color:#0D1B35;line-height:1.6">${escape(p.message)}</div>
    </div>
    ${
      p.leadId
        ? `<div style="margin-top:32px"><a href="${dashboardUrl(p.leadId)}" style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase">Voir dans le dashboard →</a></div>`
        : ""
    }
  </div>
  <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;text-align:center">kilowater.fr · Notification automatique</p>
</div></body></html>`;

  const text = `Nouveau lead — Site web

${rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n")}

Message:
${p.message}
${p.leadId ? `\nVoir : ${dashboardUrl(p.leadId)}` : ""}`;

  return {
    subject: `Nouveau lead — ${fullName}${p.typeProjet ? ` · ${p.typeProjet}` : ""}`,
    html,
    text,
  };
}

export function ackEmail(p: ContactPayload) {
  const prenom = p.prenom ? escape(p.prenom) : "";
  const greeting = prenom ? `Bonjour ${prenom},` : "Bonjour,";

  const html = `<!doctype html><html><body style="margin:0;background:#F5FAFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="background:white;border:1px solid #DBEAFE;padding:40px 32px">
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#2563EB">Kilowater</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:300;color:#0D1B35;line-height:1.3">Nous avons bien reçu<br/>votre message</h1>
    <p style="font-size:15px;color:#0D1B35;line-height:1.6">${greeting}</p>
    <p style="font-size:15px;color:#4A6285;line-height:1.6">Merci d'avoir pris contact avec Kilowater. Notre équipe étudie votre demande et reviendra vers vous <strong style="color:#0D1B35">sous 48 heures ouvrées</strong>.</p>
    <p style="font-size:15px;color:#4A6285;line-height:1.6">Pour toute demande urgente, vous pouvez nous joindre directement au <a href="tel:+33184161178" style="color:#2563EB;text-decoration:none">+33 1 84 16 11 78</a>.</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #E5EEFB">
      <p style="margin:0;font-size:13px;color:#94A3B8">Bureau d'étude en rénovation énergétique</p>
      <p style="margin:4px 0 0;font-size:13px;color:#94A3B8">115 Rue Saint-Dominique · 75007 Paris</p>
    </div>
  </div>
  <p style="margin:16px 0 0;font-size:11px;color:#94A3B8;text-align:center">Cet email vous a été envoyé suite à votre demande sur kilowater.fr</p>
</div></body></html>`;

  const text = `${greeting}

Merci d'avoir pris contact avec Kilowater. Notre équipe étudie votre demande et reviendra vers vous sous 48 heures ouvrées.

Pour toute demande urgente : +33 1 84 16 11 78

—
Kilowater · Bureau d'étude en rénovation énergétique
115 Rue Saint-Dominique · 75007 Paris`;

  return {
    subject: "Nous avons bien reçu votre message — Kilowater",
    html,
    text,
  };
}
