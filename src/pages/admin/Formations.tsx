import { useEffect, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

interface FormationForm {
  title: string; title_nl: string; organisation: string; year: string;
  description: string; description_nl: string; badge: string;
}

const EMPTY_FORM: FormationForm = { title: '', title_nl: '', organisation: '', year: '', description: '', description_nl: '', badge: '' }

export default function Formations() {
  const [formations, setFormations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormationForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('formations').select('*').order('year', { ascending: false })
    setFormations(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(f: any) {
    setEditId(f.id)
    setForm({ title: f.title, title_nl: f.title_nl || '', organisation: f.organisation || '', year: f.year || '', description: f.description || '', description_nl: f.description_nl || '', badge: f.badge || '' })
    setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, year: parseInt(form.year, 10) || null }
    if (editId) {
      await supabase.from('formations').update(payload).eq('id', editId)
    } else {
      await supabase.from('formations').insert([payload])
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette formation ?')) return
    await supabase.from('formations').delete().eq('id', id)
    setFormations(prev => prev.filter(f => f.id !== id))
  }

  const set = (k: keyof FormationForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div>
      <Topbar title="Formations & Habilitations" subtitle="Gérez vos diplômes, certifications et formations." />
      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button style={btnPrimary} onClick={openNew}>+ Ajouter une formation</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--mist)', fontStyle: 'italic' }}>Chargement…</p>
        ) : formations.length === 0 ? (
          <p style={{ color: 'var(--mist)', fontStyle: 'italic' }}>Aucune formation enregistrée.</p>
        ) : (
          <div style={s.grid}>
            {formations.map(f => (
              <div key={f.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {f.badge && <span style={{ fontSize: '1.5rem' }}>{f.badge}</span>}
                    <div>
                      <div style={s.cardTitle}>{f.title}</div>
                      <div style={s.cardOrg}>{f.organisation}</div>
                    </div>
                  </div>
                  {f.year && <span style={s.yearBadge}>{f.year}</span>}
                </div>
                {f.description && <p style={s.cardDesc}>{f.description}</p>}
                <div style={s.cardActions}>
                  <button style={btnEdit} onClick={() => openEdit(f)}>Modifier</button>
                  <button style={btnDelete} onClick={() => remove(f.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editId ? 'Modifier la formation' : 'Nouvelle formation'}</h3>
            <form onSubmit={save}>
              <Fg label="🇫🇷 Titre / Certification" value={form.title} onChange={set('title')} required />
              <Fg label="🇧🇪 Titre (NL)" value={form.title_nl} onChange={set('title_nl')} placeholder="Optionnel — laissez vide pour utiliser le titre FR" />
              <Fg label="Organisme / École" value={form.organisation} onChange={set('organisation')} />
              <Fg label="Année" value={form.year} onChange={set('year')} type="number" placeholder="2023" />
              <Fg label="🇫🇷 Description courte (optionnel)" value={form.description} onChange={set('description')} textarea />
              <Fg label="🇧🇪 Description (NL, optionnel)" value={form.description_nl} onChange={set('description_nl')} textarea />
              <Fg label="Emoji / Badge (optionnel, ex: 🎓)" value={form.badge} onChange={set('badge')} placeholder="🎓" />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
                <button type="button" style={btnCancel} onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

interface FgProps {
  label: string; value: string
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  textarea?: boolean; type?: string; required?: boolean; placeholder?: string
}

function Fg({ label, value, onChange, textarea, type = 'text', required, placeholder }: FgProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={s.label}>{label}</label>
      {textarea
        ? <textarea style={{ ...s.input, resize: 'vertical' }} rows={3} value={value} onChange={onChange} />
        : <input type={type} style={s.input} value={value} onChange={onChange} required={required} placeholder={placeholder} />}
    </div>
  )
}

const btnPrimary: CSSProperties = { background: 'var(--sage)', color: 'var(--warm-white)', border: 'none', padding: '0.65rem 1.5rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer' }
const btnEdit: CSSProperties = { background: 'transparent', border: '1px solid rgba(139,158,126,0.4)', color: 'var(--sage)', padding: '0.35rem 0.8rem', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', borderRadius: 3, cursor: 'pointer' }
const btnDelete: CSSProperties = { background: 'transparent', border: '1px solid rgba(224,112,112,0.4)', color: '#E07070', padding: '0.35rem 0.8rem', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', borderRadius: 3, cursor: 'pointer' }
const btnCancel: CSSProperties = { background: 'transparent', border: '1px solid rgba(139,158,126,0.3)', color: 'var(--mist)', padding: '0.65rem 1.2rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', borderRadius: 3, cursor: 'pointer' }

const s: Record<string, CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' },
  card: { background: 'var(--warm-white)', borderRadius: 6, padding: '1.75rem', border: '1px solid rgba(139,158,126,0.15)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  cardTitle: { fontSize: '0.95rem', fontWeight: 500, color: 'var(--charcoal)' },
  cardOrg: { fontSize: '0.78rem', color: 'var(--mist)', marginTop: '0.2rem' },
  cardDesc: { fontSize: '0.83rem', color: 'var(--mist)', lineHeight: 1.6, marginBottom: '1rem' },
  yearBadge: { background: 'var(--sage-pale)', color: 'var(--sage)', fontSize: '0.72rem', fontWeight: 500, padding: '0.2rem 0.6rem', borderRadius: 20, flexShrink: 0 },
  cardActions: { display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(139,158,126,0.1)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,44,44,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: 'var(--warm-white)', borderRadius: 8, padding: '2.5rem', width: 500, maxWidth: '90vw', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  input: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none' },
}
