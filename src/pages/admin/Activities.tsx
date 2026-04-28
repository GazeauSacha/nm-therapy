import { useEffect, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

interface ActivityForm {
  num: string; title: string; title_nl: string;
  description: string; description_nl: string;
  tags: string; tags_nl: string;
  icon_name: string; sort_order: string;
}

const EMPTY: ActivityForm = {
  num: '', title: '', title_nl: '',
  description: '', description_nl: '',
  tags: '', tags_nl: '',
  icon_name: 'star', sort_order: '0',
}

const ICON_OPTIONS = [
  { value: 'life',   label: '🌱 Life Coaching' },
  { value: 'heart',  label: '💚 Amour / Love' },
  { value: 'hypno',  label: '🌀 Hypnose' },
  { value: 'couple', label: '👥 Couple / Famille' },
  { value: 'eye',    label: '👁 EMDR / Vision' },
  { value: 'star',   label: '✨ Guidance / Intuition' },
]

export default function Activities() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<ActivityForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('activities').select('*').order('sort_order')
    setActivities(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(a: any) {
    setEditId(a.id)
    setForm({
      num: a.num || '', title: a.title || '', title_nl: a.title_nl || '',
      description: a.description || '', description_nl: a.description_nl || '',
      tags: a.tags || '', tags_nl: a.tags_nl || '',
      icon_name: a.icon_name || 'star', sort_order: String(a.sort_order ?? 0),
    })
    setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, sort_order: parseInt(form.sort_order, 10) || 0 }
    if (editId !== null) {
      await supabase.from('activities').update(payload).eq('id', editId)
    } else {
      await supabase.from('activities').insert([payload])
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function remove(id: number) {
    if (!confirm('Supprimer cette activité ?')) return
    await supabase.from('activities').delete().eq('id', id)
    setActivities(prev => prev.filter(a => a.id !== id))
  }

  const set = (k: keyof ActivityForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div>
      <Topbar title="Activités" subtitle="Gérez les activités / services affichés sur le site." />
      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button style={btnPrimary} onClick={openNew}>+ Ajouter une activité</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--mist)', fontStyle: 'italic' }}>Chargement…</p>
        ) : activities.length === 0 ? (
          <p style={{ color: 'var(--mist)', fontStyle: 'italic' }}>Aucune activité enregistrée.</p>
        ) : (
          <div style={s.grid}>
            {activities.map(a => (
              <div key={a.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={s.num}>{a.num}</span>
                    <div>
                      <div style={s.cardTitle}>{a.title}</div>
                      {a.title_nl && <div style={s.cardSub}>{a.title_nl}</div>}
                    </div>
                  </div>
                  <span style={s.iconLabel}>
                    {ICON_OPTIONS.find(o => o.value === a.icon_name)?.label.split(' ')[0] || '✨'}
                  </span>
                </div>
                {a.description && <p style={s.cardDesc}>{a.description}</p>}
                {a.tags && (
                  <div style={s.tagsRow}>
                    {a.tags.split('|').map((tag: string) => (
                      <span key={tag} style={s.tag}>{tag.trim()}</span>
                    ))}
                  </div>
                )}
                <div style={s.cardActions}>
                  <button style={btnEdit} onClick={() => openEdit(a)}>Modifier</button>
                  <button style={btnDelete} onClick={() => remove(a.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editId !== null ? "Modifier l'activité" : 'Nouvelle activité'}</h3>
            <form onSubmit={save} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                <Fg label="N° (ex: 01)" value={form.num} onChange={set('num')} placeholder="01" />
                <div style={{ marginBottom: '1rem' }}>
                  <label style={s.label}>Icône</label>
                  <select style={s.input} value={form.icon_name} onChange={set('icon_name')}>
                    {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <Fg label="🇫🇷 Titre" value={form.title} onChange={set('title')} required />
              <Fg label="🇧🇪 Titre (NL)" value={form.title_nl} onChange={set('title_nl')} placeholder="Laisser vide pour utiliser le titre FR" />
              <Fg label="🇫🇷 Description" value={form.description} onChange={set('description')} textarea />
              <Fg label="🇧🇪 Description (NL)" value={form.description_nl} onChange={set('description_nl')} textarea placeholder="Laisser vide pour utiliser la description FR" />
              <Fg label="🇫🇷 Tags (séparés par |)" value={form.tags} onChange={set('tags')} placeholder="Tag1|Tag2|Tag3" />
              <Fg label="🇧🇪 Tags (NL, séparés par |)" value={form.tags_nl} onChange={set('tags_nl')} placeholder="Tag1|Tag2|Tag3" />
              <Fg label="Ordre d'affichage" value={form.sort_order} onChange={set('sort_order')} type="number" placeholder="0" />
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
        ? <textarea style={{ ...s.input, resize: 'vertical' }} rows={3} value={value} onChange={onChange} placeholder={placeholder} />
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
  num: { fontSize: '0.7rem', fontWeight: 500, color: 'var(--sage)', background: 'var(--sage-pale)', padding: '0.2rem 0.5rem', borderRadius: 3, flexShrink: 0 },
  cardTitle: { fontSize: '0.95rem', fontWeight: 500, color: 'var(--charcoal)' },
  cardSub: { fontSize: '0.78rem', color: 'var(--mist)', marginTop: '0.2rem', fontStyle: 'italic' },
  iconLabel: { fontSize: '1.4rem', flexShrink: 0 },
  cardDesc: { fontSize: '0.83rem', color: 'var(--mist)', lineHeight: 1.6, marginBottom: '1rem' },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' },
  tag: { background: 'var(--sage-pale)', color: 'var(--sage)', fontSize: '0.68rem', padding: '0.2rem 0.6rem', borderRadius: 10 },
  cardActions: { display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(139,158,126,0.1)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,44,44,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: 'var(--warm-white)', borderRadius: 8, padding: '2.5rem', width: 540, maxWidth: '90vw', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  input: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none', boxSizing: 'border-box' },
}
