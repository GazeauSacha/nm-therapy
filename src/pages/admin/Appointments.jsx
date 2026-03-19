import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

const STATUS_MAP = {
  pending:   { label: 'En attente', bg: '#C4896A20', color: '#C4896A' },
  confirmed: { label: 'Confirmé',   bg: '#6BA88820', color: '#6BA888' },
  cancelled: { label: 'Annulé',     bg: '#E0707020', color: '#E07070' },
  done:      { label: 'Terminé',    bg: '#2C2C2C15', color: '#6B7280' },
}

const PLATFORMS = ['Google Meet', 'WhatsApp', 'Zoom', 'Présentiel']
const SUBJECTS  = ['Life Coaching', 'Love Coaching', 'Hypnose Thérapeutique', 'Thérapie de couple', 'Sexothérapie', 'EMDR / Psycho-Trauma', 'Guidance intuitive']

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ client_id: '', date: '', platform: 'Google Meet', subject: '', notes: '', status: 'pending' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [{ data: rdvs }, { data: cls }] = await Promise.all([
      supabase.from('appointments').select('*, clients(first_name, last_name, email)').order('date', { ascending: true }),
      supabase.from('clients').select('id, first_name, last_name').order('first_name'),
    ])
    setAppointments(rdvs || [])
    setClients(cls || [])
    setLoading(false)
  }

  async function saveRdv(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('appointments').insert([{ ...form }])
    setSaving(false)
    if (!error) { setShowForm(false); setForm({ client_id: '', date: '', platform: 'Google Meet', subject: '', notes: '', status: 'pending' }); load() }
  }

  async function updateStatus(id, status) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)

  return (
    <div>
      <Topbar title="Rendez-vous" subtitle="Gérez vos rendez-vous et votre calendrier." />
      <div style={{ padding: '2rem' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={btnStyle('var(--sage)')} onClick={() => setShowForm(true)}>+ Nouveau RDV</button>
          {['all', 'pending', 'confirmed', 'done', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...btnSmStyle, background: filter === f ? 'var(--charcoal)' : 'transparent', color: filter === f ? 'var(--warm-white)' : 'var(--mist)' }}>
              {f === 'all' ? 'Tous' : STATUS_MAP[f]?.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={s.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>{['Client', 'Date & Heure', 'Accompagnement', 'Plateforme', 'Statut', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--mist)', fontSize: '0.85rem' }}>Chargement…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--mist)', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucun rendez-vous.</td></tr>
                ) : filtered.map(rdv => (
                  <tr key={rdv.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={s.av}>{rdv.clients?.first_name?.[0]}</div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{rdv.clients?.first_name} {rdv.clients?.last_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--mist)' }}>{rdv.clients?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>{new Date(rdv.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {new Date(rdv.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={s.td}>{rdv.subject}</td>
                    <td style={s.td}>{rdv.platform}</td>
                    <td style={s.td}><StatusBadge status={rdv.status} /></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {rdv.status === 'pending' && <button style={btnSmStyle2('var(--sage)')} onClick={() => updateStatus(rdv.id, 'confirmed')}>Confirmer</button>}
                        {rdv.status === 'confirmed' && <button style={btnSmStyle2('var(--charcoal)')} onClick={() => updateStatus(rdv.id, 'done')}>Terminé</button>}
                        {rdv.status !== 'cancelled' && <button style={btnSmStyle2('var(--danger)')} onClick={() => updateStatus(rdv.id, 'cancelled')}>Annuler</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showForm && (
          <div style={s.modalOverlay} onClick={() => setShowForm(false)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h3 style={s.modalTitle}>Nouveau rendez-vous</h3>
              <form onSubmit={saveRdv}>
                <div style={s.formGroup}>
                  <label style={s.label}>Client</label>
                  <select style={s.input} value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} required>
                    <option value="">Choisir un client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Date & Heure</label>
                  <input type="datetime-local" style={s.input} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Accompagnement</label>
                  <select style={s.input} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                    <option value="">Choisir…</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Plateforme</label>
                  <select style={s.input} value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}>
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Notes (optionnel)</label>
                  <textarea style={{ ...s.input, resize: 'vertical' }} rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" style={btnStyle('var(--sage)')} disabled={saving}>{saving ? 'Enregistrement…' : 'Créer le RDV'}</button>
                  <button type="button" style={btnStyle('var(--mist)')} onClick={() => setShowForm(false)}>Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const { label, bg, color } = STATUS_MAP[status] || { label: status, bg: '#eee', color: '#999' }
  return <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.65rem', borderRadius: 20, background: bg, color, fontWeight: 500 }}>{label}</span>
}

const btnStyle = (bg) => ({ background: bg, color: 'var(--warm-white)', border: 'none', padding: '0.65rem 1.4rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer' })
const btnSmStyle = { background: 'transparent', border: '1px solid rgba(139,158,126,0.3)', padding: '0.4rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s' }
const btnSmStyle2 = (color) => ({ background: 'transparent', border: `1px solid ${color}`, color, padding: '0.3rem 0.7rem', fontFamily: 'Jost, sans-serif', fontSize: '0.7rem', borderRadius: 3, cursor: 'pointer' })

const s = {
  card: { background: 'var(--warm-white)', borderRadius: 6, border: '1px solid rgba(139,158,126,0.15)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)', padding: '0.6rem 1rem', textAlign: 'left', borderBottom: '1px solid rgba(139,158,126,0.15)' },
  tr: { borderBottom: '1px solid rgba(139,158,126,0.08)' },
  td: { padding: '0.85rem 1rem', fontSize: '0.83rem', color: 'var(--charcoal)', verticalAlign: 'middle' },
  av: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', color: 'var(--warm-white)', flexShrink: 0 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(44,44,44,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: 'var(--warm-white)', borderRadius: 8, padding: '2.5rem', width: 480, maxWidth: '90vw', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '1.5rem' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  input: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none' },
}
