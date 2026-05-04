import { getAdmin, sendEmail } from "./lib/admin";
import { makeToken } from "./lib/token";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { clientId, clientEmail, firstName, date, platform, subject, notes } = req.body;

    const db = getAdmin();

    const { data: appt, error } = await db
      .from("appointments")
      .insert([{
        client_id: clientId,
        date,
        platform,
        subject,
        notes,
        status: "pending",
        reminder_24h_sent: false,
        reminder_1h_sent: false,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error || !appt) throw new Error(error?.message ?? "Insert returned null");

    const token = makeToken(appt.id);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nancymtherapy.be";
    const confirmUrl = `${siteUrl}/api/confirm-appointment?id=${appt.id}&token=${encodeURIComponent(token)}`;
    const dateFormatted = new Date(date).toLocaleString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Brussels",
    });

    await sendEmail({
      to: clientEmail,
      subject: `Proposition de rendez-vous — Nancy M Therapy`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
          <p>Bonjour ${firstName},</p>
          <p>Je vous propose le rendez-vous suivant :</p>
          <table style="border-collapse:collapse;margin:1.5rem 0;">
            <tr><td style="padding:0.4rem 1rem 0.4rem 0;color:#888;font-size:0.9em;">Date</td><td style="font-weight:500;">${dateFormatted}</td></tr>
            <tr><td style="padding:0.4rem 1rem 0.4rem 0;color:#888;font-size:0.9em;">Type de séance</td><td>${subject || "Non précisé"}</td></tr>
            <tr><td style="padding:0.4rem 1rem 0.4rem 0;color:#888;font-size:0.9em;">Plateforme</td><td>${platform}</td></tr>
            ${notes ? `<tr><td style="padding:0.4rem 1rem 0.4rem 0;color:#888;font-size:0.9em;">Notes</td><td>${notes}</td></tr>` : ""}
          </table>
          <a href="${confirmUrl}" style="display:inline-block;background:#8b9e7e;color:#fff;padding:0.75rem 1.5rem;text-decoration:none;border-radius:3px;font-family:sans-serif;">Confirmer ce rendez-vous →</a>
          <p style="color:#888;font-size:0.85em;margin-top:1.5rem;">Si ce créneau ne vous convient pas, répondez simplement à cet email.</p>
          <p style="color:#888;font-size:0.85em;">— Nancy M. · Nancy M Therapy</p>
        </div>
      `,
    });

    return res.status(200).json({ appointment: appt });
  } catch (err: any) {
    console.error("[create-appointment]", err);
    return res.status(500).json({ error: err.message ?? "Internal error" });
  }
}
