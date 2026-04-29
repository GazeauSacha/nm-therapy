import { makeToken } from "./lib/token";
import { getAdmin, sendEmail } from "./lib/admin";

export default async function handler(req: any, res: any) {
  try {
    const { id, token } = req.query as { id: string; token: string };

    if (!id || !token || token !== makeToken(id)) {
      return res.status(400).send(page("Lien invalide", `
        <div style="color:#c44;">
          <div style="font-size:2rem;margin-bottom:1rem;">✕</div>
          <h2 style="font-weight:300;">Lien invalide ou expiré</h2>
          <p>Merci de contacter Nancy directement.</p>
        </div>
      `));
    }

    const db = getAdmin();

    const { data: appt } = await db
      .from("appointments")
      .select("status, clients(first_name, last_name, email)")
      .eq("id", id)
      .maybeSingle();

    if (!appt) return res.status(404).send(page("Introuvable", `<p>Rendez-vous introuvable.</p>`));

    if (appt.status === "confirmed") {
      return res.send(page("Déjà confirmé", `
        <div style="color:#8b9e7e;">
          <div style="font-size:2rem;margin-bottom:1rem;">✓</div>
          <h2 style="font-weight:300;">Rendez-vous déjà confirmé</h2>
          <p>Merci !</p>
        </div>
      `));
    }

    await db.from("appointments").update({ status: "confirmed" }).eq("id", id);

    const client = appt.clients as any;
    if (client?.email) {
      await sendEmail({
        to: process.env.NANCY_EMAIL!,
        subject: `${client.first_name} ${client.last_name} a confirmé son rendez-vous`,
        html: `<p style="font-family:Georgia,serif;">${client.first_name} ${client.last_name} a confirmé son rendez-vous.</p>`,
      }).catch(console.error);
    }

    return res.send(page("Rendez-vous confirmé", `
      <div style="color:#8b9e7e;">
        <div style="font-size:2.5rem;margin-bottom:1rem;">✓</div>
        <h2 style="font-weight:300;font-size:1.8rem;">Rendez-vous confirmé</h2>
        <p style="color:#555;">Merci ! Nancy a bien reçu votre confirmation.</p>
        <p style="color:#888;font-size:0.85em;">Vous recevrez un rappel 24h et 1h avant votre séance.</p>
      </div>
    `));
  } catch (err: any) {
    console.error("[confirm-appointment]", err);
    return res.status(500).send(page("Erreur", `<p style="color:#c44;">Une erreur est survenue : ${err.message}</p>`));
  }
}

function page(title: string, body: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${title} — Nancy M Therapy</title></head>
  <body style="font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f7f4ee;">
    <div style="text-align:center;padding:3rem;max-width:440px;">${body}</div>
  </body></html>`;
}
