import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Outlet, useNavigate, useMatch, useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

interface OutletCtx { isMobile: boolean; unreadMsg: number; pendingRdv: number }

export default function ContactsLayout() {
  const { isMobile } = useOutletContext<OutletCtx>()
  const navigate = useNavigate()
  const match = useMatch('/admin/contacts/:id')
  const selectedId = match?.params.id

  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const sub = supabase
      .channel('contacts-layout')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contacts' }, (p) => {
        setContacts((prev) => [p.new, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contacts' }, (p) => {
        setContacts((prev) => prev.map((c) => (c.id === p.new.id ? p.new : c)))
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
  const showList = !isMobile || !selectedId
  const showDetail = !isMobile || !!selectedId

  return (
    <div>
      <Topbar
        title="Contacts"
        subtitle={unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Tous les contacts'}
      />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', height: 'calc(100vh - 73px)', overflow: 'hidden' }}>

        {/* Liste gauche */}
        {showList && (
          <div style={s.list}>
            {loading ? (
              <div style={s.empty}>Chargement…</div>
            ) : contacts.length === 0 ? (
              <div style={s.empty}>Aucun message reçu.</div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c.id}
                  style={{ ...s.item, ...(c.id === selectedId ? s.itemActive : {}), ...(c.read ? {} : s.itemUnread) }}
                  onClick={() => navigate(`/admin/contacts/${c.id}`)}
                >
                  <div style={s.av}>{c.first_name?.[0] || '?'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: c.read ? 400 : 600, color: 'var(--charcoal)' }}>
                        {c.first_name} {c.last_name}
                      </span>
                      {!c.read && <span style={s.dot} />}
                    </div>
                    <div style={s.preview}>{c.subject || c.message?.slice(0, 50)}</div>
                    {c.status === 'replied' && <span style={s.tagReplied}>Répondu</span>}
                    {c.status === 'converted' && <span style={s.tagConverted}>Client</span>}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--mist)', flexShrink: 0 }}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Détail droite */}
        {showDetail && (
          <div style={s.detail}>
            {selectedId ? (
              <Outlet context={{ isMobile }} />
            ) : (
              <div style={s.emptyDetail}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💬</div>
                <p>Sélectionnez un contact pour voir la conversation.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  list: { borderRight: '1px solid rgba(139,158,126,0.15)', overflowY: 'auto', background: 'var(--warm-white)' },
  item: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.9rem 1.25rem', borderBottom: '1px solid rgba(139,158,126,0.08)', cursor: 'pointer', transition: 'background 0.12s' },
  itemActive: { background: 'rgba(139,158,126,0.1)', borderLeft: '3px solid var(--sage)' },
  itemUnread: { background: 'rgba(139,158,126,0.03)' },
  av: { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', color: 'var(--warm-white)', flexShrink: 0, marginTop: '0.1rem' },
  preview: { fontSize: '0.72rem', color: 'var(--mist)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' },
  dot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--clay)', display: 'inline-block', flexShrink: 0 },
  tagReplied: { display: 'inline-block', marginTop: '0.25rem', fontSize: '0.6rem', color: 'var(--sage)', border: '1px solid var(--sage)', padding: '0.05rem 0.4rem', borderRadius: 10 },
  tagConverted: { display: 'inline-block', marginTop: '0.25rem', fontSize: '0.6rem', color: 'var(--clay)', border: '1px solid var(--clay)', padding: '0.05rem 0.4rem', borderRadius: 10 },
  detail: { overflowY: 'auto', background: '#F7F4EE', display: 'flex', flexDirection: 'column' },
  emptyDetail: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--mist)', fontSize: '0.85rem', fontStyle: 'italic', height: '100%' },
  empty: { padding: '2rem', color: 'var(--mist)', fontSize: '0.83rem', fontStyle: 'italic', textAlign: 'center' },
}
