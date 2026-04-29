import { getAdmin, sendEmail } from "./lib/admin";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { contactId, to, firstName, subject, message } = req.body;

    if (!contactId || !to || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await sendEmail({
      to,
      subject: `Re: ${subject || "Votre demande Nancy M Therapy"}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
          <p>Bonjour ${firstName},</p>
          <div style="white-space:pre-wrap;line-height:1.7;">${message}</div>
          <br/>
          <p style="color:#888;font-size:0.85em;">— Nancy M. · Nancy M Therapy</p>
        </div>
      `,
    });

    const db = getAdmin();

    const { data: newReply, error } = await db
      .from("replies")
      .insert([
        {
          contact_id: contactId,
          message,
          direction: "outbound",
          sent_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    await db.from("contacts").update({ status: "replied" }).eq("id", contactId);

    return res.status(200).json({ reply: newReply });
  } catch (err: any) {
    console.error("[send-reply]", err);
    return res.status(500).json({ error: err.message ?? "Internal error" });
  }
}
