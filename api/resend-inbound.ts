import { createHmac, timingSafeEqual } from "crypto";
import { getAdmin, sendEmail } from "./lib/admin";

export const config = { api: { bodyParser: false } };

async function getRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(secret: string, msgId: string, timestamp: string, rawBody: string, sigHeader: string): boolean {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const toSign = `${msgId}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes).update(toSign).digest("base64");
  return sigHeader.split(" ").some((sig) => {
    const value = sig.startsWith("v1,") ? sig.slice(3) : sig;
    try {
      return timingSafeEqual(Buffer.from(value, "base64"), Buffer.from(expected, "base64"));
    } catch {
      return false;
    }
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const rawBuffer = await getRawBody(req);
    const rawBody = rawBuffer.toString("utf-8");

    const secret = process.env.RESEND_INBOUND_SECRET;
    if (secret) {
      const msgId = req.headers["svix-id"] as string;
      const timestamp = req.headers["svix-timestamp"] as string;
      const sig = req.headers["svix-signature"] as string;
      if (!msgId || !timestamp || !sig || !verifySignature(secret, msgId, timestamp, rawBody, sig)) {
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    const body = JSON.parse(rawBody);
    const payload = body.data ?? body;
    const { from, text, html } = payload;

    const emailMatch = (from as string)?.match(/<(.+?)>/);
    const senderEmail = emailMatch ? emailMatch[1] : from;
    if (!senderEmail) return res.status(400).json({ error: "No sender" });

    const db = getAdmin();

    const { data: contact } = await db
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("email", senderEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!contact) return res.status(200).json({ skipped: "no contact found" });

    const message = ((text as string) || ((html as string) || "").replace(/<[^>]+>/g, "")).trim();

    await db.from("replies").insert([{
      contact_id: contact.id,
      message: message.slice(0, 5000),
      direction: "inbound",
      sent_at: new Date().toISOString(),
    }]);

    await db.from("contacts").update({ read: false }).eq("id", contact.id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nancymtherapy.be";
    const nancyEmail = process.env.NANCY_EMAIL;
    if (nancyEmail) {
      await sendEmail({
        to: nancyEmail,
        subject: `Nouveau message de ${contact.first_name} ${contact.last_name}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
            <h2 style="font-weight:300;color:#8b9e7e;">Nouveau message reçu</h2>
            <p><strong>${contact.first_name} ${contact.last_name}</strong> — ${senderEmail}</p>
            <blockquote style="border-left:3px solid #8b9e7e;padding-left:1rem;color:#555;white-space:pre-wrap;">${message.slice(0, 500)}</blockquote>
            <a href="${siteUrl}/admin/contacts/${contact.id}" style="display:inline-block;margin-top:1.5rem;background:#8b9e7e;color:#fff;padding:0.75rem 1.5rem;text-decoration:none;border-radius:3px;font-family:sans-serif;">Voir et répondre →</a>
          </div>
        `,
      }).catch(console.error);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[resend-inbound]", err);
    return res.status(500).json({ error: err.message ?? "Internal error" });
  }
}
