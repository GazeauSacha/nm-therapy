import { getAdmin, sendEmail } from "../lib/admin";

export default async function handler(req: any, res: any) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).end();
  }

  try {
    const db = getAdmin();
    const now = new Date();

    const windows = {
      "24h": {
        from: new Date(now.getTime() + 23 * 3600 * 1000).toISOString(),
        to: new Date(now.getTime() + 25 * 3600 * 1000).toISOString(),
        flag: "reminder_24h_sent",
      },
      "1h": {
        from: new Date(now.getTime() + 50 * 60 * 1000).toISOString(),
        to: new Date(now.getTime() + 70 * 60 * 1000).toISOString(),
        flag: "reminder_1h_sent",
      },
    };

    const results: Record<string, number> = {};

    for (const [label, w] of Object.entries(windows)) {
      const { data: appts } = await db
        .from("appointments")
        .select("id, date, subject, platform, clients(first_name, email)")
        .in("status", ["confirmed", "pending"])
        .eq(w.flag, false)
        .gte("date", w.from)
        .lte("date", w.to);

      const sent: string[] = [];

      for (const appt of appts || []) {
        const client = (appt as any).clients;
        if (!client?.email) continue;

        const dateFormatted = new Date(appt.date).toLocaleString("fr-FR", {
          weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          timeZone: "Europe/Brussels",
        });

        const isDay = label === "24h";
        await sendEmail({
          to: client.email,
          subject: isDay ? `Rappel — Votre rendez-vous demain` : `Rappel — Votre rendez-vous dans 1 heure`,
          html: `
            <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
              <p>Bonjour ${client.first_name},</p>
              <p>Rappel : votre rendez-vous est <strong>${isDay ? "demain" : "dans 1 heure"}</strong> :</p>
              <p style="font-weight:500;font-size:1.05em;">${dateFormatted}</p>
              ${appt.subject ? `<p>Type : ${appt.subject}</p>` : ""}
              ${appt.platform ? `<p>Via : ${appt.platform}</p>` : ""}
              <p style="color:#888;font-size:0.85em;margin-top:1.5rem;">— Nancy M. · Nancy M Therapy</p>
            </div>
          `,
        }).catch(console.error);

        sent.push(appt.id);
      }

      if (sent.length > 0) {
        await db.from("appointments").update({ [w.flag]: true }).in("id", sent);
      }

      results[label] = sent.length;
    }

    return res.status(200).json(results);
  } catch (err: any) {
    console.error("[cron/reminders]", err);
    return res.status(500).json({ error: err.message ?? "Internal error" });
  }
}
