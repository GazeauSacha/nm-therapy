import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', subject: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('clients').select('*, appointments(count)').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  async function saveClient(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('clients').insert([{ ...form, created_at: new Date().toISOString() }])
    setSaving(false)
    if (!error) { setShowForm(false); setForm({ first_name: '', last_name: '', email: '', phone: '', subject: '', notes: '' }); load() }
  }

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Topbar title="Clients" subtitle="Suivi de vos clients et de leurs accompagnements." />
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <button style={btn('var(--sage)')} onClick={() => setShowForm(true)}>+ Nouveau client</button>
          <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.5rem 1rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', outline: 'none', flex: 1, maxWidth: 320 }} />
        </div>

        <div style={s.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>{['Client', 'Email', 'Téléphone', 'Accompagnement', 'RDV', 'Notes', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={7} style={s.empty}>Chargement…</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={7} style={s.empty}>Aucun client trouvé.</td></tr>
                  : filtered.map(c => (
                    <tr key={c.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={s.av}>{c.first_name?.[0]}</div>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{c.first_name} {c.last_name}</div>
                        </div>
                      </td>
                      <td style={s.td}><a href={`mailto:${c.email}`} style={{ color: 'var(--sage)', textDecoration: 'none' }}>{c.email}</a></td>
                      <td style={s.td}>{c.phone || '—'}</td>
                      <td style={s.td}>{c.subject || '—'}</td>
                      <td style={s.td}>{c.appointments?.[0]?.count || 0}</td>
                      <td style={s.td}><span style={{ fontSize: '0.78rem', color: 'var(--mist)' }}>{c.notes?.slice(0, 40) || '—'}</span></td>
                      <td style={s.td}>
                        <a href={`mailto:${c.email}`} style={{ ...btnSm, color: 'var(--sage)', borderColor: 'var(--sage)' }}>Email</a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div style={s.overlay} onClick={() => setShowForm(false)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h3 style={s.modalTitle}>Nouveau client</h3>
              <form onSubmit={saveClient}>
                <div style={s.row}>
                  <Fg label="Prénom" value={form.first_name} onChange={v => setForm(p => ({ ...p, first_name: v }))} required />
                  <Fg label="Nom" value={form.last_name} onChange={v => setForm(p => ({ ...p, last_name: v }))} required />
                </div>
                <Fg label="Email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} required />
                <Fg label="Téléphone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
                <div style={s.formGroup}>
                  <label style={s.label}>Accompagnement souhaité</label>
                  <select style={s.input} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                    <option value="">Choisir…</option>
                    {['Life Coaching','Love Coaching','Hypnose Thérapeutique','Thérapie de couple','Sexothérapie','EMDR / Psycho-Trauma','Guidance intuitive'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Notes internes</label>
                  <textarea style={{ ...s.input, resize: 'vertical' }} rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" style={btn('var(--sage)')} disabled={saving}>{saving ? 'Enregistrement…' : 'Créer le client'}</button>
                  <button type="button" style={btn('var(--mist)')} onClick={() => setShowForm(false)}>Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Fg({ label, value, onChange, type = 'text', required }) {
  return (
    <div style={s.formGroup}>
      <label style={s.label}>{label}</label>
      <input type={type} style={s.input} value={value} onChange={e => onChange(e.target.value)} required={required} />
    </div>
  )
}

const btn = (bg) => ({ background: bg, color: 'var(--warm-white)', border: 'none', padding: '0.65rem 1.4rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer' })
const btnSm = { fontSize: '0.7rem', padding: '0.3rem 0.7rem', borderRadius: 3, cursor: 'pointer', border: '1px solid', background: 'transparent', fontFamily: 'Jost, sans-serif', textDecoration: 'none', display: 'inline-block' }

const s = {
  card: { background: 'var(--warm-white)', borderRadius: 6, border: '1px solid rgba(139,158,126,0.15)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)', padding: '0.6rem 1rem', textAlign: 'left', borderBottom: '1px solid rgba(139,158,126,0.15)' },
  tr: { borderBottom: '1px solid rgba(139,158,126,0.08)' },
  td: { padding: '0.85rem 1rem', fontSize: '0.83rem', color: 'var(--charcoal)', verticalAlign: 'middle' },
  empty: { padding: '2rem', textAlign: 'center', color: 'var(--mist)', fontSize: '0.85rem', fontStyle: 'italic' },
  av: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', color: 'var(--warm-white)', flexShrink: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,44,44,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: 'var(--warm-white)', borderRadius: 8, padding: '2.5rem', width: 520, maxWidth: '90vw', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 300, marginBottom: '1.5rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  input: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none' },
}
