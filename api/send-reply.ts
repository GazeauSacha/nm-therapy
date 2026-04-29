import { supabaseAdmin, sendEmail } from './lib/admin'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end()

  const { contactId, to, firstName, subject, message } = req.body

  if (!contactId || !to || !message) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Send email
  try {
    await sendEmail({
      to,
      subject: `Re: ${subject || 'Votre demande Nancy M Therapy'}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
          <p>Bonjour ${firstName},</p>
          <div style="white-space:pre-wrap;line-height:1.7;">${message}</div>
          <br/>
          <p style="color:#888;font-size:0.85em;">— Nancy M. · Nancy M Therapy</p>
        </div>
      `,
    })
  } catch (err: any) {
    console.error('Resend error:', err)
    return res.status(500).json({ error: `Email non envoyé : ${err.message}` })
  }

  // Save reply to DB
  const { data: newReply, error } = await supabaseAdmin
    .from('replies')
    .insert([{ contact_id: contactId, message, direction: 'outbound', sent_at: new Date().toISOString() }])
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ error: error.message })
  }

  await supabaseAdmin.from('contacts').update({ status: 'replied' }).eq('id', contactId)

  return res.status(200).json({ reply: newReply })
}
