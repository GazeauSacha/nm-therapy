import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

export default function Contacts() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    load()

    const sub = supabase
      .channel('contacts-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contacts' }, (payload) => {
        setContacts((prev) => [payload.new, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contacts' }, (payload) => {
        setContacts((prev) => prev.map((c) => (c.id === payload.new.id ? payload.new : c)))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  async function load() {
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    setContacts(data || [])
    setLoading(false)
  }

  const unreadCount = contacts.filter((c) => !c.read).length

  return (
    <div>
      <Topbar title="Contacts" subtitle={`${unreadCount} message${unreadCount !== 1 ? 's' : ''} non lu${unreadCount !== 1 ? 's' : ''}`} />
      <div style={s.page}>
        <div style={s.card}>
          {loading ? (
            <div style={s.empty}>Chargement…</div>
          ) : contacts.length === 0 ? (
            <div style={s.empty}>Aucun message reçu pour le moment.</div>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                style={{ ...s.row, ...(c.read ? {} : s.rowUnread) }}
                onClick={() => navigate(`/admin/contacts/${c.id}`)}
              >
                <div style={s.av}>{c.first_name?.[0] || '?'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ ...s.name, fontWeight: c.read ? 400 : 600 }}>
                      {c.first_name} {c.last_name}
                    </span>
                    {!c.read && <span style={s.dot} />}
                    {c.status === 'replied' && <span style={s.tagReplied}>Répondu</span>}
                    {c.status === 'converted' && <span style={s.tagConverted}>Client</span>}
                  </div>
                  <div style={s.preview}>{c.subject || c.message?.slice(0, 80)}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={s.date}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={s.email}>{c.email}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  page: { padding: '2rem' },
  card: { background: 'var(--warm-white)', borderRadius: 6, border: '1px solid rgba(139,158,126,0.15)', overflow: 'hidden' },
  row: { display: 'flex', gap: '1rem', padding: '1.1rem 1.5rem', borderBottom: '1px solid rgba(139,158,126,0.08)', cursor: 'pointer', transition: 'background 0.15s', alignItems: 'center' },
  rowUnread: { background: 'rgba(139,158,126,0.04)' },
  av: { width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--warm-white)', flexShrink: 0 },
  name: { fontSize: '0.88rem', color: 'var(--charcoal)' },
  preview: { fontSize: '0.75rem', color: 'var(--mist)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' },
  date: { fontSize: '0.7rem', color: 'var(--mist)' },
  email: { fontSize: '0.68rem', color: 'rgba(139,158,126,0.6)', marginTop: '0.15rem' },
  dot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--clay)', display: 'inline-block', flexShrink: 0 },
  tagReplied: { fontSize: '0.62rem', color: 'var(--sage)', border: '1px solid var(--sage)', padding: '0.1rem 0.45rem', borderRadius: 10 },
  tagConverted: { fontSize: '0.62rem', color: 'var(--clay)', border: '1px solid var(--clay)', padding: '0.1rem 0.45rem', borderRadius: 10 },
  empty: { padding: '3rem', textAlign: 'center', color: 'var(--mist)', fontSize: '0.85rem', fontStyle: 'italic' },
}
