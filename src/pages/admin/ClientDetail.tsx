import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

const PLATFORMS = ['Google Meet', 'WhatsApp', 'Zoom', 'Présentiel']
const SUBJECTS = ['Life Coaching', 'Love Coaching', 'Hypnose Thérapeutique', 'Thérapie de couple', 'Sexothérapie', 'EMDR / Psycho-Trauma', 'Guidance intuitive']

const STATUS_LABEL: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmé', done: 'Terminé', cancelled: 'Annulé' }
const STATUS_COLOR: Record<string, string> = { pending: '#c7a040', confirmed: 'var(--sage)', done: 'var(--mist)', cancelled: '#c44' }
const INV_STATUS_LABEL: Record<string, string> = { pending: 'En attente', paid: 'Payée', overdue: 'En retard' }
const INV_STATUS_COLOR: Record<string, string> = { pending: '#c7a040', paid: 'var(--sage)', overdue: '#c44' }

interface RdvForm { date: string; platform: string; subject: string; notes: string }
interface InvForm { number: string; amount: string; description: string; date: string }

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()

  const [client, setClient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showRdv, setShowRdv] = useState(false)
  const [rdvForm, setRdvForm] = useState<RdvForm>({ date: '', platform: 'Google Meet', subject: '', notes: '' })
  const [savingRdv, setSavingRdv] = useState(false)

  const [showInv, setShowInv] = useState(false)
  const [invForm, setInvForm] = useState<InvForm>({ number: '', amount: '', description: '', date: '' })
  const [savingInv, setSavingInv] = useState(false)

  const [editNotes, setEditNotes] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!id) return
    loadAll()
  }, [id])

  async function loadAll() {
    const [{ data: c }, { data: a }, { data: i }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('appointments').select('*').eq('client_id', id).order('date', { ascending: false }),
      supabase.from('invoices').select('*').eq('client_id', id).order('date', { ascending: false }),
    ])
    setClient(c)
    setNotes(c?.notes || '')
    setAppointments(a || [])
    setInvoices(i || [])
    setLoading(false)
  }

  async function saveNotes() {
    await supabase.from('clients').update({ notes }).eq('id', id)
    setClient((prev: any) => ({ ...prev, notes }))
    setEditNotes(false)
  }

  async function createRdv(e: React.FormEvent) {
    e.preventDefault()
    setSavingRdv(true)
    try {
      const res = await fetch('/api/create-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          clientEmail: client.email,
          firstName: client.first_name,
          date: new Date(rdvForm.date).toISOString(),
          platform: rdvForm.platform,
          subject: rdvForm.subject,
          notes: rdvForm.notes,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { appointment } = await res.json()
      setAppointments((prev) => [appointment, ...prev])
      setShowRdv(false)
      setRdvForm({ date: '', platform: 'Google Meet', subject: '', notes: '' })
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setSavingRdv(false)
    }
  }

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault()
    setSavingInv(true)
    const { data, error } = await supabase.from('invoices').insert([{
      client_id: id,
      number: invForm.number,
      amount: parseFloat(invForm.amount),
      description: invForm.description,
      date: invForm.date,
      status: 'pending',
      created_at: new Date().toISOString(),
    }]).select().single()
    setSavingInv(false)
    if (error) { alert('Erreur : ' + error.message); return }
    setInvoices((prev) => [data, ...prev])
    setShowInv(false)
    setInvForm({ number: '', amount: '', description: '', date: '' })
  }

  async function updateApptStatus(apptId: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', apptId)
    setAppointments((prev) => prev.map((a) => a.id === apptId ? { ...a, status } : a))
  }

  async function updateInvStatus(invId: string, status: string) {
    await supabase.from('invoices').update({ status }).eq('id', invId)
    setInvoices((prev) => prev.map((i) => i.id === invId ? { ...i, status } : i))
  }

  if (loading) return <div style={s.loading}>Chargement…</div>
  if (!client) return <div style={s.loading}>Client introuvable.</div>

  return (
    <div>
      <Topbar
        title={`${client.first_name} ${client.last_name}`}
        subtitle={client.subject || 'Client'}
        back={{ label: '← Clients', to: '/admin/clients' }}
      />

      <div style={s.page}>
        {/* Client info card */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.av}>{client.first_name?.[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={s.clientName}>{client.first_name} {client.last_name}</div>
              <div style={s.clientMeta}>
                <a href={`mailto:${client.email}`} style={s.link}>{client.email}</a>
                {client.phone && <span> · {client.phone}</span>}
              </div>
              {client.subject && <div style={s.tag}>{client.subject}</div>}
            </div>
          </div>
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(139,158,126,0.1)' }}>
            <div style={s.sectionLabel}>Notes internes</div>
            {editNotes ? (
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  style={s.notesArea}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button style={s.btnSage} onClick={saveNotes}>Sauvegarder</button>
                  <button style={s.btnOutline} onClick={() => { setEditNotes(false); setNotes(client.notes || '') }}>Annuler</button>
                </div>
              </div>
            ) : (
              <p style={s.notesText} onClick={() => setEditNotes(true)}>
                {client.notes || <span style={{ fontStyle: 'italic', color: 'var(--mist)' }}>Aucune note — cliquer pour ajouter</span>}
              </p>
            )}
          </div>
        </div>

        {/* Appointments */}
        <div style={s.section}>
          <div style={s.sectionTop}>
            <h3 style={s.sectionTitle}>Rendez-vous ({appointments.length})</h3>
            <button style={s.btnSage} onClick={() => setShowRdv(true)}>+ Nouveau RDV</button>
          </div>
          <div style={s.card}>
            {appointments.length === 0 ? (
              <div style={s.empty}>Aucun rendez-vous.</div>
            ) : appointments.map((a) => (
              <div key={a.id} style={s.apptRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--charcoal)' }}>
                    {new Date(a.date).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--mist)', marginTop: '0.15rem' }}>
                    {a.subject || '—'} · {a.platform}
                  </div>
                  {a.notes && <div style={{ fontSize: '0.72rem', color: 'var(--mist)', marginTop: '0.15rem', fontStyle: 'italic' }}>{a.notes}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ ...s.statusBadge, color: STATUS_COLOR[a.status], borderColor: STATUS_COLOR[a.status] }}>
                    {STATUS_LABEL[a.status] || a.status}
                  </span>
                  <select
                    value={a.status}
                    onChange={(e) => updateApptStatus(a.id, e.target.value)}
                    style={s.statusSelect}
                  >
                    {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices */}
        <div style={s.section}>
          <div style={s.sectionTop}>
            <h3 style={s.sectionTitle}>Factures ({invoices.length})</h3>
            <button style={s.btnSage} onClick={() => setShowInv(true)}>+ Nouvelle facture</button>
          </div>
          <div style={s.card}>
            {invoices.length === 0 ? (
              <div style={s.empty}>Aucune facture.</div>
            ) : invoices.map((inv) => (
              <div key={inv.id} style={s.apptRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--charcoal)' }}>
                    {inv.number} — {Number(inv.amount).toFixed(2)} €
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--mist)', marginTop: '0.15rem' }}>
                    {inv.description || '—'} · {inv.date ? new Date(inv.date).toLocaleDateString('fr-FR') : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ ...s.statusBadge, color: INV_STATUS_COLOR[inv.status], borderColor: INV_STATUS_COLOR[inv.status] }}>
                    {INV_STATUS_LABEL[inv.status] || inv.status}
                  </span>
                  <select
                    value={inv.status}
                    onChange={(e) => updateInvStatus(inv.id, e.target.value)}
                    style={s.statusSelect}
                  >
                    {Object.entries(INV_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RDV Modal */}
      {showRdv && (
        <div style={s.overlay} onClick={() => setShowRdv(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Nouveau rendez-vous</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--mist)', marginBottom: '1.5rem' }}>
              Pour : <strong>{client.first_name} {client.last_name}</strong>
            </p>
            <form onSubmit={createRdv}>
              <Fg label="Date & Heure" type="datetime-local" value={rdvForm.date} onChange={(v) => setRdvForm((p) => ({ ...p, date: v }))} required />
              <div style={s.formGroup}>
                <label style={s.formLabel}>Type de séance</label>
                <select style={s.formInput} value={rdvForm.subject} onChange={(e) => setRdvForm((p) => ({ ...p, subject: e.target.value }))}>
                  <option value="">Choisir…</option>
                  {SUBJECTS.map((sub) => <option key={sub}>{sub}</option>)}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Plateforme</label>
                <select style={s.formInput} value={rdvForm.platform} onChange={(e) => setRdvForm((p) => ({ ...p, platform: e.target.value }))}>
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Notes (optionnel)</label>
                <textarea style={{ ...s.formInput, resize: 'vertical' }} rows={3} value={rdvForm.notes} onChange={(e) => setRdvForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" style={s.btnSage} disabled={savingRdv}>{savingRdv ? 'Envoi…' : 'Créer & envoyer'}</button>
                <button type="button" style={s.btnOutline} onClick={() => setShowRdv(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInv && (
        <div style={s.overlay} onClick={() => setShowInv(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Nouvelle facture</h3>
            <form onSubmit={createInvoice}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Fg label="Numéro" value={invForm.number} onChange={(v) => setInvForm((p) => ({ ...p, number: v }))} required />
                <Fg label="Montant (€)" type="number" value={invForm.amount} onChange={(v) => setInvForm((p) => ({ ...p, amount: v }))} required />
              </div>
              <Fg label="Description" value={invForm.description} onChange={(v) => setInvForm((p) => ({ ...p, description: v }))} />
              <Fg label="Date" type="date" value={invForm.date} onChange={(v) => setInvForm((p) => ({ ...p, date: v }))} required />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" style={s.btnSage} disabled={savingInv}>{savingInv ? 'Enregistrement…' : 'Créer la facture'}</button>
                <button type="button" style={s.btnOutline} onClick={() => setShowInv(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

interface FgProps { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }
function Fg({ label, value, onChange, type = 'text', required }: FgProps) {
  return (
    <div style={s.formGroup}>
      <label style={s.formLabel}>{label}</label>
      <input type={type} style={s.formInput} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  loading: { padding: '3rem', color: 'var(--mist)', fontSize: '0.85rem', fontStyle: 'italic' },
  page: { padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' },
  card: { background: 'var(--warm-white)', borderRadius: 6, border: '1px solid rgba(139,158,126,0.15)', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.5rem' },
  av: { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--warm-white)', flexShrink: 0 },
  clientName: { fontSize: '1rem', fontWeight: 500, color: 'var(--charcoal)' },
  clientMeta: { fontSize: '0.78rem', color: 'var(--mist)', marginTop: '0.2rem' },
  link: { color: 'var(--sage)', textDecoration: 'none' },
  tag: { display: 'inline-block', marginTop: '0.5rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clay)', border: '1px solid var(--clay)', padding: '0.1rem 0.5rem', borderRadius: 10 },
  sectionLabel: { fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.5rem' },
  notesText: { fontSize: '0.85rem', color: 'var(--charcoal)', lineHeight: 1.6, cursor: 'text', minHeight: '2rem', margin: 0, whiteSpace: 'pre-wrap' },
  notesArea: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.75rem 1rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  section: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  sectionTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 300, color: 'var(--charcoal)', margin: 0 },
  apptRow: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(139,158,126,0.08)' },
  statusBadge: { fontSize: '0.65rem', padding: '0.15rem 0.6rem', borderRadius: 10, border: '1px solid', whiteSpace: 'nowrap' },
  statusSelect: { fontSize: '0.72rem', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.25rem 0.4rem', background: 'var(--warm-white)', color: 'var(--charcoal)', outline: 'none', cursor: 'pointer' },
  empty: { padding: '2rem', textAlign: 'center', color: 'var(--mist)', fontSize: '0.83rem', fontStyle: 'italic' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,44,44,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 },
  modal: { background: 'var(--warm-white)', borderRadius: 8, padding: '2.5rem', width: 500, maxWidth: '90vw', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '0.5rem', marginTop: 0 },
  formGroup: { marginBottom: '1rem' },
  formLabel: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  formInput: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none', boxSizing: 'border-box' },
  btnSage: { background: 'var(--sage)', color: 'var(--warm-white)', border: 'none', padding: '0.65rem 1.4rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer' },
  btnOutline: { background: 'transparent', color: 'var(--mist)', border: '1px solid var(--mist)', padding: '0.65rem 1.2rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', borderRadius: 3, cursor: 'pointer' },
}
