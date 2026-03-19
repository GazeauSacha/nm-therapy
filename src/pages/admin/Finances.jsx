import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

const STATUS_MAP = {
  paid:    { label: 'Payée',      bg: '#6BA88820', color: '#6BA888' },
  pending: { label: 'En attente', bg: '#C4896A20', color: '#C4896A' },
  overdue: { label: 'En retard',  bg: '#E0707020', color: '#E07070' },
}

export default function Finances() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ client_id: '', amount: '', description: '', status: 'pending', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: inv }, { data: cls }] = await Promise.all([
      supabase.from('invoices').select('*, clients(first_name, last_name, email)').order('date', { ascending: false }),
      supabase.from('clients').select('id, first_name, last_name').order('first_name'),
    ])
    setInvoices(inv || [])
    setClients(cls || [])
    setLoading(false)
  }

  async function saveInvoice(e) {
    e.preventDefault()
    setSaving(true)
    const num = `#${String(invoices.length + 1).padStart(3, '0')}`
    const { error } = await supabase.from('invoices').insert([{ ...form, number: num, amount: parseFloat(form.amount) }])
    setSaving(false)
    if (!error) { setShowForm(false); setForm({ client_id: '', amount: '', description: '', status: 'pending', date: new Date().toISOString().split('T')[0] }); load() }
  }

  async function updateStatus(id, status) {
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  // Stats
  const totalMonth = invoices
    .filter(i => new Date(i.date).getMonth() === new Date().getMonth())
    .reduce((sum, i) => sum + (i.amount || 0), 0)
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount || 0), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0)

  return (
    <div>
      <Topbar title="Facturation" subtitle="Suivi de vos revenus et factures." />
      <div style={{ padding: '2rem' }}>

        {/* Stats */}
        <div style={s.statsGrid}>
          <StatCard label="Facturé ce mois" value={`${totalMonth} €`} color="var(--sage)" />
          <StatCard label="En attente paiement" value={`${totalPending} €`} color="var(--clay)" />
          <StatCard label="Total encaissé" value={`${totalPaid} €`} color="var(--gold)" />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button style={btn('var(--sage)')} onClick={() => setShowForm(true)}>+ Nouvelle facture</button>
        </div>

        <div style={s.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>{['N°', 'Client', 'Date', 'Description', 'Montant', 'Statut', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading
                  ? <tr><td colSpan={7} style={s.empty}>Chargement…</td></tr>
                  : invoices.length === 0
                  ? <tr><td colSpan={7} style={s.empty}>Aucune facture enregistrée.</td></tr>
                  : invoices.map(inv => (
                    <tr key={inv.id} style={s.tr}>
                      <td style={{ ...s.td, fontWeight: 600, color: 'var(--charcoal)' }}>{inv.number}</td>
                      <td style={s.td}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{inv.clients?.first_name} {inv.clients?.last_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--mist)' }}>{inv.clients?.email}</div>
                      </td>
                      <td style={s.td}>{new Date(inv.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={s.td}>{inv.description}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{inv.amount} €</td>
                      <td style={s.td}><StatusBadge status={inv.status} /></td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {inv.status === 'pending' && (
                            <button style={btnSm('var(--sage)')} onClick={() => updateStatus(inv.id, 'paid')}>✓ Payée</button>
                          )}
                          {inv.status === 'pending' && (
                            <button style={btnSm('var(--clay)')} onClick={() => {
                              const mailto = `mailto:${inv.clients?.email}?subject=Facture ${inv.number} - NM Therapy&body=Bonjour,%0D%0A%0D%0AVeuillez trouver ci-joint votre facture ${inv.number} d'un montant de ${inv.amount} €.%0D%0A%0D%0AMerci,%0D%0ANancy Massaoudi`
                              window.open(mailto)
                            }}>Envoyer</button>
                          )}
                          {inv.status === 'pending' && (
                            <button style={btnSm('var(--danger)')} onClick={() => updateStatus(inv.id, 'overdue')}>Retard</button>
                          )}
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
          <div style={s.overlay} onClick={() => setShowForm(false)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h3 style={s.modalTitle}>Nouvelle facture</h3>
              <form onSubmit={saveInvoice}>
                <div style={s.fg}>
                  <label style={s.label}>Client</label>
                  <select style={s.input} value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} required>
                    <option value="">Choisir un client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                  </select>
                </div>
                <div style={s.row}>
                  <div style={s.fg}>
                    <label style={s.label}>Montant (€)</label>
                    <input type="number" style={s.input} placeholder="90" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
                  </div>
                  <div style={s.fg}>
                    <label style={s.label}>Date</label>
                    <input type="date" style={s.input} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                  </div>
                </div>
                <div style={s.fg}>
                  <label style={s.label}>Description</label>
                  <input type="text" style={s.input} placeholder="Séance individuelle · Life Coaching" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="submit" style={btn('var(--sage)')} disabled={saving}>{saving ? 'Enregistrement…' : 'Créer la facture'}</button>
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

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--warm-white)', borderRadius: 6, padding: '1.5rem', border: '1px solid rgba(139,158,126,0.15)', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.75rem' }}>{label}</div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', fontWeight: 300, color: 'var(--charcoal)' }}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const { label, bg, color } = STATUS_MAP[status] || { label: status, bg: '#eee', color: '#999' }
  return <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.65rem', borderRadius: 20, background: bg, color, fontWeight: 500 }}>{label}</span>
}

const btn = (bg) => ({ background: bg, color: 'var(--warm-white)', border: 'none', padding: '0.65rem 1.4rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer' })
const btnSm = (color) => ({ fontSize: '0.7rem', padding: '0.3rem 0.7rem', borderRadius: 3, cursor: 'pointer', border: `1px solid ${color}`, color, background: 'transparent', fontFamily: 'Jost, sans-serif' })

const s = {
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem', marginBottom: '1.5rem' },
  card: { background: 'var(--warm-white)', borderRadius: 6, border: '1px solid rgba(139,158,126,0.15)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)', padding: '0.6rem 1rem', textAlign: 'left', borderBottom: '1px solid rgba(139,158,126,0.15)' },
  tr: { borderBottom: '1px solid rgba(139,158,126,0.08)' },
  td: { padding: '0.85rem 1rem', fontSize: '0.83rem', color: 'var(--charcoal)', verticalAlign: 'middle' },
  empty: { padding: '2rem', textAlign: 'center', color: 'var(--mist)', fontSize: '0.85rem', fontStyle: 'italic' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,44,44,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: 'var(--warm-white)', borderRadius: 8, padding: '2.5rem', width: 480, maxWidth: '90vw', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 300, marginBottom: '1.5rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  fg: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  input: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none' },
}
