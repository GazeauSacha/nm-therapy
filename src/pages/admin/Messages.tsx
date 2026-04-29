import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'
import { useOutletContext } from 'react-router-dom'

interface OutletCtx { isMobile: boolean; unreadMsg: number; pendingRdv: number }

const PLATFORMS = ['Google Meet', 'WhatsApp', 'Zoom', 'Présentiel']
const SUBJECTS  = ['Life Coaching', 'Love Coaching', 'Hypnose Thérapeutique', 'Thérapie de couple', 'Sexothérapie', 'EMDR / Psycho-Trauma', 'Guidance intuitive']

interface RdvForm { date: string; platform: string; subject: string; notes: string }

export default function Messages() {
  const { isMobile } = useOutletContext<OutletCtx>()
  const [contacts, setContacts] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [showRdv, setShowRdv] = useState(false)
  const [rdvForm, setRdvForm] = useState<RdvForm>({ date: '', platform: 'Google Meet', subject: '', notes: '' })
  const [savingRdv, setSavingRdv] = useState(false)

  useEffect(() => {
    loadContacts()

    const sub = supabase
      .channel('contacts-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contacts' }, (payload) => {
        setContacts((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  async function loadContacts() {
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    setContacts(data || [])
    setLoading(false)
  }

  async function loadReplies(contactId: string) {
    const { data } = await supabase.from('replies').select('*').eq('contact_id', contactId).order('sent_at', { ascending: true })
    setReplies(data || [])
  }

  async function selectContact(c: any) {
    setSelected(c)
    setReply('')
    setReplies([])
    await loadReplies(c.id)
    if (!c.read) {
      await supabase.from('contacts').update({ read: true }).eq('id', c.id)
      setContacts((prev) => prev.map((m) => (m.id === c.id ? { ...m, read: true } : m)))
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim() || !selected) return
    setSending(true)

    try {
      const { error: fnError } = await supabase.functions.invoke('send-mail', {
        body: {
          to: selected.email,
          subject: `Re: ${selected.subject || 'Votre demande Nancy M Therapy'}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #333;">
              <p>Bonjour ${selected.first_name},</p>
              <div style="white-space: pre-wrap; line-height: 1.7;">${reply}</div>
              <br/>
              <p style="color: #888; font-size: 0.85em;">— Nancy M. · Nancy M Therapy</p>
            </div>
          `,
        },
      })

      if (fnError) throw new Error(fnError.message)

      const { data: newReply } = await supabase.from('replies').insert([{
        contact_id: selected.id,
        message: reply,
        sent_at: new Date().toISOString(),
      }]).select().single()

      if (newReply) setReplies(prev => [...prev, newReply])

      await supabase.from('contacts').update({ status: 'replied' }).eq('id', selected.id)
      setContacts((prev) => prev.map((m) => m.id === selected.id ? { ...m, status: 'replied' } : m))

      setReply('')
    } catch (err: any) {
      alert('❌ Erreur lors de l\'envoi : ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function createRdv(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSavingRdv(true)

    try {
      let clientId = null
      const { data: existingClient } = await supabase.from('clients').select('id').eq('email', selected.email).single()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data: newClient } = await supabase
          .from('clients')
          .insert([{ first_name: selected.first_name, last_name: selected.last_name, email: selected.email, phone: selected.phone }])
          .select().single()
        if (newClient) clientId = newClient.id
      }

      const dateISO = new Date(rdvForm.date).toISOString()
      await supabase.from('appointments').insert([{
        client_id: clientId,
        date: dateISO,
        platform: rdvForm.platform,
        subject: rdvForm.subject,
        notes: rdvForm.notes,
        status: 'pending',
      }])

      const dateFormatted = new Date(rdvForm.date).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      const rdvMsg = `📅 Proposition de rendez-vous\n\nDate : ${dateFormatted}\nType : ${rdvForm.subject || 'Non précisé'}\nPlateforme : ${rdvForm.platform}${rdvForm.notes ? `\nNotes : ${rdvForm.notes}` : ''}\n\nMerci de confirmer ou de me contacter si ce créneau ne vous convient pas.`

      await supabase.functions.invoke('send-mail', {
        body: {
          to: selected.email,
          subject: `Proposition de rendez-vous — Nancy M Therapy`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #333;">
              <p>Bonjour ${selected.first_name},</p>
              <p>Je vous propose le rendez-vous suivant :</p>
              <table style="border-collapse: collapse; margin: 1.5rem 0;">
                <tr><td style="padding: 0.4rem 1rem 0.4rem 0; color: #888; font-size: 0.9em;">Date</td><td style="padding: 0.4rem 0; font-weight: 500;">${dateFormatted}</td></tr>
                <tr><td style="padding: 0.4rem 1rem 0.4rem 0; color: #888; font-size: 0.9em;">Type de séance</td><td style="padding: 0.4rem 0;">${rdvForm.subject || 'Non précisé'}</td></tr>
                <tr><td style="padding: 0.4rem 1rem 0.4rem 0; color: #888; font-size: 0.9em;">Plateforme</td><td style="padding: 0.4rem 0;">${rdvForm.platform}</td></tr>
                ${rdvForm.notes ? `<tr><td style="padding: 0.4rem 1rem 0.4rem 0; color: #888; font-size: 0.9em;">Notes</td><td style="padding: 0.4rem 0;">${rdvForm.notes}</td></tr>` : ''}
              </table>
              <p>Merci de me confirmer ce créneau ou de me contacter si celui-ci ne vous convient pas.</p>
              <br/>
              <p style="color: #888; font-size: 0.85em;">— Nancy M. · Nancy M Therapy</p>
            </div>
          `,
        },
      })

      const { data: autoReply } = await supabase.from('replies').insert([{
        contact_id: selected.id,
        message: rdvMsg,
        sent_at: new Date().toISOString(),
      }]).select().single()

      if (autoReply) setReplies(prev => [...prev, autoReply])

      setShowRdv(false)
      setRdvForm({ date: '', platform: 'Google Meet', subject: '', notes: '' })
      alert('✅ RDV créé et message envoyé dans la conversation !')
    } catch (err: any) {
      alert('❌ Erreur : ' + err.message)
    } finally {
      setSavingRdv(false)
    }
  }

  const unreadCount = contacts.filter((c) => !c.read).length

  return (
    <div>
      <Topbar
        title="Messages"
        subtitle={`${unreadCount} message${unreadCount !== 1 ? 's' : ''} non lu${unreadCount !== 1 ? 's' : ''}`}
      />
      <div style={{ ...s.layout, gridTemplateColumns: isMobile ? '1fr' : '340px 1fr' }}>
        {/* List */}
        <div style={{ ...s.list, display: isMobile && selected ? 'none' : undefined }}>
          <div style={s.listHeader}>
            <span style={s.listTitle}>Boîte de réception</span>
            {unreadCount > 0 && <span style={s.badge}>{unreadCount}</span>}
          </div>
          {loading ? (
            <div style={s.empty}>Chargement…</div>
          ) : contacts.length === 0 ? (
            <div style={s.empty}>Aucun message reçu.</div>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                style={{ ...s.msgItem, ...(selected?.id === c.id ? s.msgSelected : {}), ...(c.read ? {} : s.msgUnread) }}
                onClick={() => selectContact(c)}
              >
                <div style={s.av}>{c.first_name?.[0] || '?'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...s.msgName, fontWeight: c.read ? 400 : 600 }}>{c.first_name} {c.last_name}</div>
                  <div style={s.msgPreview}>{c.subject || c.message?.slice(0, 60)}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={s.msgTime}>{new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                  {!c.read && <span style={s.unreadDot} />}
                  {c.status === 'replied' && <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>✓ Répondu</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        <div style={{ ...s.detail, display: isMobile && !selected ? 'none' : 'flex' }}>
          {isMobile && selected && (
            <button
              onClick={() => setSelected(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--sage)', cursor: 'pointer', borderBottom: '1px solid rgba(139,158,126,0.12)', width: '100%' }}
            >
              ← Retour aux messages
            </button>
          )}
          {!selected ? (
            <div style={s.noSelect}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
              <p>Sélectionnez un message pour le lire et y répondre.</p>
            </div>
          ) : (
            <>
              <div style={s.detailHeader}>
                <div style={s.av}>{selected.first_name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--charcoal)' }}>{selected.first_name} {selected.last_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--mist)' }}>{selected.email} · {selected.phone}</div>
                </div>
                <button style={s.rdvBtn} onClick={() => setShowRdv(true)}>📅 Proposer un RDV</button>
              </div>

              <div style={s.thread}>
                <div style={s.bubbleClient}>
                  {selected.subject && <div style={s.msgSubject}>Motif : {selected.subject}</div>}
                  <p style={{ fontSize: '0.9rem', color: 'var(--charcoal)', lineHeight: 1.7, margin: 0 }}>{selected.message}</p>
                  <div style={s.msgMeta}>{new Date(selected.created_at).toLocaleString('fr-FR')}</div>
                </div>
                {replies.map((r) => (
                  <div key={r.id} style={s.bubbleAdmin}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--warm-white)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{r.message}</p>
                    <div style={{ ...s.msgMeta, color: 'rgba(253,251,247,0.6)', textAlign: 'right' }}>{new Date(r.sent_at).toLocaleString('fr-FR')}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={sendReply} style={s.replyForm}>
                <label style={s.replyLabel}>Votre réponse</label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={5}
                  placeholder={`Bonjour ${selected.first_name},\n\nMerci pour votre message…`}
                  style={s.replyArea}
                  required
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" style={s.sendBtn} disabled={sending}>{sending ? 'Envoi…' : 'Envoyer la réponse'}</button>
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Votre demande Nancy M Therapy'}&body=Bonjour ${selected.first_name},%0D%0A%0D%0A`}
                    style={s.mailtoBtn}
                  >
                    Ouvrir dans Gmail →
                  </a>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* RDV Modal */}
      {showRdv && (
        <div style={s.modalOverlay} onClick={() => setShowRdv(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Proposer un rendez-vous</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--mist)', marginBottom: '1.5rem' }}>
              Pour : <strong>{selected?.first_name} {selected?.last_name}</strong>
            </p>
            <form onSubmit={createRdv}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Date & Heure</label>
                <input type="datetime-local" style={s.formInput} value={rdvForm.date} onChange={e => setRdvForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Type de séance</label>
                <select style={s.formInput} value={rdvForm.subject} onChange={e => setRdvForm(p => ({ ...p, subject: e.target.value }))}>
                  <option value="">Choisir…</option>
                  {SUBJECTS.map(sub => <option key={sub}>{sub}</option>)}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Plateforme</label>
                <select style={s.formInput} value={rdvForm.platform} onChange={e => setRdvForm(p => ({ ...p, platform: e.target.value }))}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Notes (optionnel)</label>
                <textarea style={{ ...s.formInput, resize: 'vertical' }} rows={3} value={rdvForm.notes} onChange={e => setRdvForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" style={s.sendBtn} disabled={savingRdv}>{savingRdv ? 'Enregistrement…' : 'Confirmer & envoyer'}</button>
                <button type="button" style={s.mailtoBtn} onClick={() => setShowRdv(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  layout: { display: 'grid', gridTemplateColumns: '340px 1fr', height: 'calc(100vh - 73px)' },
  list: { borderRight: '1px solid rgba(139,158,126,0.15)', overflowY: 'auto', background: 'var(--warm-white)' },
  listHeader: { padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(139,158,126,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { fontSize: '0.85rem', fontWeight: 500, color: 'var(--charcoal)' },
  badge: { background: 'var(--clay)', color: 'var(--warm-white)', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: 10 },
  msgItem: { display: 'flex', gap: '0.85rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(139,158,126,0.08)', cursor: 'pointer', transition: 'background 0.15s' },
  msgSelected: { background: 'var(--sage-pale)' },
  msgUnread: { background: 'rgba(139,158,126,0.04)' },
  av: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--warm-white)', flexShrink: 0 },
  msgName: { fontSize: '0.88rem', color: 'var(--charcoal)' },
  msgPreview: { fontSize: '0.75rem', color: 'var(--mist)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' },
  msgTime: { fontSize: '0.68rem', color: 'var(--mist)' },
  unreadDot: { display: 'block', width: 8, height: 8, borderRadius: '50%', background: 'var(--clay)', margin: '0.25rem 0 0 auto' },
  detail: { display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#F7F4EE' },
  noSelect: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--mist)', fontSize: '0.88rem', fontStyle: 'italic' },
  detailHeader: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem 2rem', background: 'var(--warm-white)', borderBottom: '1px solid rgba(139,158,126,0.1)', flexShrink: 0 },
  thread: { flex: 1, padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  bubbleClient: { alignSelf: 'flex-start', maxWidth: '75%', background: 'var(--warm-white)', borderRadius: '6px 6px 6px 0', padding: '1.25rem 1.5rem', border: '1px solid rgba(139,158,126,0.15)' },
  bubbleAdmin: { alignSelf: 'flex-end', maxWidth: '75%', background: 'var(--sage)', borderRadius: '6px 6px 0 6px', padding: '1.25rem 1.5rem' },
  msgSubject: { fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: '0.75rem' },
  msgMeta: { fontSize: '0.7rem', color: 'var(--mist)', marginTop: '0.75rem' },
  replyForm: { margin: '0 2rem 2rem', background: 'var(--warm-white)', borderRadius: 6, padding: '1.5rem', border: '1px solid rgba(139,158,126,0.15)', flexShrink: 0 },
  replyLabel: { display: 'block', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.5rem' },
  replyArea: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.85rem 1rem', fontFamily: 'Jost, sans-serif', fontSize: '0.9rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none', resize: 'vertical', marginBottom: '1rem' },
  sendBtn: { background: 'var(--sage)', color: 'var(--warm-white)', border: 'none', padding: '0.75rem 1.5rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer' },
  mailtoBtn: { background: 'transparent', color: 'var(--clay)', border: '1px solid var(--clay)', padding: '0.75rem 1.2rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', borderRadius: 3, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
  rdvBtn: { background: 'var(--clay)', color: 'var(--warm-white)', border: 'none', padding: '0.5rem 1rem', fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', borderRadius: 3, cursor: 'pointer', letterSpacing: '0.08em' },
  empty: { padding: '2rem', color: 'var(--mist)', fontSize: '0.85rem', fontStyle: 'italic' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(44,44,44,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 },
  modal: { background: 'var(--warm-white)', borderRadius: 8, padding: '2.5rem', width: 480, maxWidth: '90vw', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '0.5rem' },
  formGroup: { marginBottom: '1rem' },
  formLabel: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  formInput: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none' },
}
