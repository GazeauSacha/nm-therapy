import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [contact, setContact] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [converting, setConverting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadContact()
    loadReplies()

    const sub = supabase
      .channel(`contact-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies', filter: `contact_id=eq.${id}` }, (payload) => {
        setReplies((prev) => prev.some((r) => r.id === payload.new.id) ? prev : [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [id])

  async function loadContact() {
    const { data } = await supabase.from('contacts').select('*').eq('id', id).single()
    setContact(data)
    setLoading(false)
    if (data && !data.read) {
      await supabase.from('contacts').update({ read: true }).eq('id', id)
      setContact((prev: any) => ({ ...prev, read: true }))
    }
  }

  async function loadReplies() {
    const { data } = await supabase.from('replies').select('*').eq('contact_id', id).order('sent_at', { ascending: true })
    setReplies(data || [])
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim() || !contact) return
    setSending(true)
    try {
      const res = await fetch('/api/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          to: contact.email,
          firstName: contact.first_name,
          subject: contact.subject,
          message: reply,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { reply: newReply } = await res.json()
      setReplies((prev) => [...prev, newReply])
      setContact((prev: any) => ({ ...prev, status: 'replied' }))
      setReply('')
    } catch (err: any) {
      alert('Erreur lors de l\'envoi : ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function convertToClient() {
    if (!contact) return
    setConverting(true)
    try {
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('email', contact.email)
        .maybeSingle()

      let clientId: string
      if (existing) {
        clientId = existing.id
      } else {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert([{
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            subject: contact.subject,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single()
        if (error) throw new Error(error.message)
        clientId = newClient.id
      }

      await supabase.from('contacts').update({ status: 'converted' }).eq('id', contact.id)
      navigate(`/admin/clients/${clientId}`)
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setConverting(false)
    }
  }

  if (loading) return <div style={s.loading}>Chargement…</div>
  if (!contact) return <div style={s.loading}>Contact introuvable.</div>

  return (
    <div>
      <Topbar
        title={`${contact.first_name} ${contact.last_name}`}
        subtitle={contact.email}
        back={{ label: '← Contacts', to: '/admin/contacts' }}
      />

      <div style={s.detailHeader}>
        <div style={s.av}>{contact.first_name?.[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={s.headerName}>{contact.first_name} {contact.last_name}</div>
          <div style={s.headerMeta}>{contact.email}{contact.phone ? ` · ${contact.phone}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {contact.status !== 'converted' && (
            <button style={s.convertBtn} onClick={convertToClient} disabled={converting}>
              {converting ? 'Conversion…' : 'Convertir en client'}
            </button>
          )}
          {contact.status === 'converted' && (
            <span style={s.tagConverted}>Converti en client</span>
          )}
        </div>
      </div>

      <div style={s.thread}>
        {/* Initial message */}
        <div style={s.bubbleClient}>
          {contact.subject && <div style={s.subject}>Motif : {contact.subject}</div>}
          <p style={s.text}>{contact.message}</p>
          <div style={s.meta}>{new Date(contact.created_at).toLocaleString('fr-FR')}</div>
        </div>

        {/* Thread replies */}
        {replies.map((r) => (
          <div key={r.id} style={r.direction === 'inbound' ? s.bubbleClient : s.bubbleAdmin}>
            {r.direction === 'inbound' && (
              <div style={{ ...s.subject, marginBottom: '0.5rem' }}>Réponse du client</div>
            )}
            <p style={{ ...s.text, color: r.direction === 'inbound' ? 'var(--charcoal)' : 'var(--warm-white)' }}>
              {r.message}
            </p>
            <div style={{ ...s.meta, color: r.direction === 'inbound' ? 'var(--mist)' : 'rgba(253,251,247,0.6)', textAlign: r.direction === 'inbound' ? 'left' : 'right' }}>
              {new Date(r.sent_at).toLocaleString('fr-FR')}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendReply} style={s.replyForm}>
        <label style={s.replyLabel}>Votre réponse</label>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          placeholder={`Bonjour ${contact.first_name},\n\nMerci pour votre message…`}
          style={s.replyArea}
          required
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
          <button type="submit" style={s.sendBtn} disabled={sending}>
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
          <a
            href={`mailto:${contact.email}?subject=Re: ${contact.subject || 'Votre demande Nancy M Therapy'}`}
            style={s.mailtoBtn}
          >
            Ouvrir dans Gmail
          </a>
        </div>
      </form>
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  loading: { padding: '3rem', color: 'var(--mist)', fontSize: '0.85rem', fontStyle: 'italic' },
  detailHeader: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 2rem', background: 'var(--warm-white)', borderBottom: '1px solid rgba(139,158,126,0.1)', flexShrink: 0, flexWrap: 'wrap' },
  av: { width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--warm-white)', flexShrink: 0 },
  headerName: { fontSize: '0.95rem', fontWeight: 500, color: 'var(--charcoal)' },
  headerMeta: { fontSize: '0.75rem', color: 'var(--mist)', marginTop: '0.1rem' },
  convertBtn: { background: 'var(--clay)', color: 'var(--warm-white)', border: 'none', padding: '0.55rem 1rem', fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', letterSpacing: '0.07em', borderRadius: 3, cursor: 'pointer' },
  tagConverted: { fontSize: '0.75rem', color: 'var(--clay)', border: '1px solid var(--clay)', padding: '0.35rem 0.75rem', borderRadius: 3, display: 'inline-flex', alignItems: 'center' },
  thread: { padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#F7F4EE', minHeight: '200px' },
  bubbleClient: { alignSelf: 'flex-start', maxWidth: '75%', background: 'var(--warm-white)', borderRadius: '6px 6px 6px 0', padding: '1.25rem 1.5rem', border: '1px solid rgba(139,158,126,0.15)' },
  bubbleAdmin: { alignSelf: 'flex-end', maxWidth: '75%', background: 'var(--sage)', borderRadius: '6px 6px 0 6px', padding: '1.25rem 1.5rem' },
  subject: { fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: '0.75rem' },
  text: { fontSize: '0.9rem', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', color: 'var(--charcoal)' },
  meta: { fontSize: '0.7rem', color: 'var(--mist)', marginTop: '0.75rem' },
  replyForm: { margin: '0 2rem 1.5rem', background: 'var(--warm-white)', borderRadius: 6, padding: '1.25rem 1.5rem', border: '1px solid rgba(139,158,126,0.15)', flexShrink: 0 },
  replyLabel: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.5rem' },
  replyArea: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.75rem 1rem', fontFamily: 'Jost, sans-serif', fontSize: '0.9rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  sendBtn: { background: 'var(--sage)', color: 'var(--warm-white)', border: 'none', padding: '0.65rem 1.4rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer' },
  mailtoBtn: { background: 'transparent', color: 'var(--clay)', border: '1px solid var(--clay)', padding: '0.65rem 1.2rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', borderRadius: 3, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
}
