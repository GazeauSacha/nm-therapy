import { getAdmin, sendEmail } from "./lib/admin";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { first_name, last_name, email, phone, subject, message } = req.body;

    const db = getAdmin();

    const { data, error } = await db
      .from("contacts")
      .insert([{ first_name, last_name, email, phone, subject, message, read: false, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nancymtherapy.be";

    await sendEmail({
      to: process.env.NANCY_EMAIL!,
      subject: `Nouveau message de ${first_name} ${last_name}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
          <h2 style="font-weight:300;color:#8b9e7e;">Nouveau message reçu</h2>
          <p><strong>${first_name} ${last_name}</strong> — ${email}${phone ? ` · ${phone}` : ""}</p>
          ${subject ? `<p style="color:#888;font-size:0.9em;font-style:italic;">Motif : ${subject}</p>` : ""}
          <blockquote style="border-left:3px solid #8b9e7e;padding-left:1rem;color:#555;white-space:pre-wrap;">${message}</blockquote>
          <a href="${siteUrl}/admin/contacts/${data.id}" style="display:inline-block;margin-top:1.5rem;background:#8b9e7e;color:#fff;padding:0.75rem 1.5rem;text-decoration:none;border-radius:3px;font-family:sans-serif;">Voir le message et répondre →</a>
        </div>
      `,
    }).catch(console.error);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[submit-contact]", err);
    return res.status(500).json({ error: err.message ?? "Internal error" });
  }
}
