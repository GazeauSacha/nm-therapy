import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getAdmin(): SupabaseClient<any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient<any>(url, key);
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const from =
    process.env.RESEND_FROM_EMAIL ||
    "Nancy M Therapy <noreply@nancymtherapy.be>";

  const inboundAddress =
    process.env.RESEND_INBOUND_ADDRESS || "contact@nancymtherapy.be";

  const payload: Record<string, any> = { from, to, subject, html, reply_to: replyTo || inboundAddress };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }

  return res.json();
}
