import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from './lib/admin'

export const config = { api: { bodyParser: false } }

async function getRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function verifySignature(secret: string, msgId: string, timestamp: string, rawBody: string, sigHeader: string): boolean {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const toSign = `${msgId}.${timestamp}.${rawBody}`
  const expected = createHmac('sha256', secretBytes).update(toSign).digest('base64')
  return sigHeader.split(' ').some((sig) => {
    const value = sig.startsWith('v1,') ? sig.slice(3) : sig
    try {
      return timingSafeEqual(Buffer.from(value, 'base64'), Buffer.from(expected, 'base64'))
    } catch {
      return false
    }
  })
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBuffer = await getRawBody(req)
  const rawBody = rawBuffer.toString('utf-8')

  const secret = process.env.RESEND_INBOUND_SECRET
  if (secret) {
    const msgId = req.headers['svix-id'] as string
    const timestamp = req.headers['svix-timestamp'] as string
    const sig = req.headers['svix-signature'] as string

    if (!msgId || !timestamp || !sig || !verifySignature(secret, msgId, timestamp, rawBody, sig)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
  }

  const body = JSON.parse(rawBody)
  const { from, text, html } = body

  const emailMatch = (from as string)?.match(/<(.+?)>/)
  const senderEmail = emailMatch ? emailMatch[1] : from

  if (!senderEmail) return res.status(400).json({ error: 'No sender' })

  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id')
    .eq('email', senderEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!contact) return res.status(200).json({ skipped: 'no contact found' })

  const message = ((text as string) || ((html as string) || '').replace(/<[^>]+>/g, '')).trim()

  await supabaseAdmin.from('replies').insert([{
    contact_id: contact.id,
    message: message.slice(0, 5000),
    direction: 'inbound',
    sent_at: new Date().toISOString(),
  }])

  await supabaseAdmin.from('contacts').update({ read: false }).eq('id', contact.id)

  return res.status(200).json({ ok: true })
}
