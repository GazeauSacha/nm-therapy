import { useEffect, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

interface OfferForm {
  label: string; label_nl: string;
  price: string; price_nl: string;
  detail: string; detail_nl: string;
  note: string; note_nl: string;
  btn_text: string; btn_text_nl: string;
  featured: boolean; sort_order: string;
}

const EMPTY: OfferForm = {
  label: '', label_nl: '',
  price: '', price_nl: '',
  detail: '', detail_nl: '',
  note: '', note_nl: '',
  btn_text: 'Prendre Contact', btn_text_nl: 'Neem contact op',
  featured: false, sort_order: '0',
}

export default function Offers() {
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<OfferForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('offers').select('*').order('sort_order')
    setOffers(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(o: any) {
    setEditId(o.id)
    setForm({
      label: o.label || '', label_nl: o.label_nl || '',
      price: o.price || '', price_nl: o.price_nl || '',
      detail: o.detail || '', detail_nl: o.detail_nl || '',
      note: o.note || '', note_nl: o.note_nl || '',
      btn_text: o.btn_text || 'Prendre Contact', btn_text_nl: o.btn_text_nl || '',
      featured: o.featured || false, sort_order: String(o.sort_order ?? 0),
    })
    setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, sort_order: parseInt(form.sort_order, 10) || 0 }
    if (editId !== null) {
      await supabase.from('offers').update(payload).eq('id', editId)
    } else {
      await supabase.from('offers').insert([payload])
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function remove(id: number) {
    if (!confirm('Supprimer cette offre ?')) return
    await supabase.from('offers').delete().eq('id', id)
    setOffers(prev => prev.filter(o => o.id !== id))
  }

  const set = (k: keyof OfferForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div>
      <Topbar title="Offres & Tarifs" subtitle="Gérez les offres de services affichées sur le site." />
      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button style={btnPrimary} onClick={openNew}>+ Ajouter une offre</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--mist)', fontStyle: 'italic' }}>Chargement…</p>
        ) : offers.length === 0 ? (
          <p style={{ color: 'var(--mist)', fontStyle: 'italic' }}>Aucune offre enregistrée.</p>
        ) : (
          <div style={s.grid}>
            {offers.map(o => (
              <div key={o.id} style={{ ...s.card, ...(o.featured ? s.cardFeatured : {}) }}>
                <div style={s.cardTop}>
                  <div>
                    <div style={s.cardLabel}>{o.label}</div>
                    {o.label_nl && <div style={s.cardLabelNl}>{o.label_nl}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <div style={s.price}>{o.price}</div>
                    {o.featured && <span style={s.featuredBadge}>★ Mis en avant</span>}
                  </div>
                </div>
                {o.detail && <p style={s.cardDesc}>{o.detail}</p>}
                {o.note && <p style={s.note}>{o.note}</p>}
                <div style={s.cardActions}>
                  <button style={btnEdit} onClick={() => openEdit(o)}>Modifier</button>
                  <button style={btnDelete} onClick={() => remove(o.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editId !== null ? "Modifier l'offre" : 'Nouvelle offre'}</h3>
            <form onSubmit={save} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <Fg label="🇫🇷 Intitulé de l'offre" value={form.label} onChange={set('label')} required />
              <Fg label="🇧🇪 Intitulé (NL)" value={form.label_nl} onChange={set('label_nl')} placeholder="Laisser vide pour utiliser le FR" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Fg label="🇫🇷 Prix / Formule" value={form.price} onChange={set('price')} placeholder="Sur rendez-vous" />
                <Fg label="🇧🇪 Prix (NL)" value={form.price_nl} onChange={set('price_nl')} placeholder="Op afspraak" />
              </div>
              <Fg label="🇫🇷 Détail" value={form.detail} onChange={set('detail')} textarea />
              <Fg label="🇧🇪 Détail (NL)" value={form.detail_nl} onChange={set('detail_nl')} textarea />
              <Fg label="🇫🇷 Note / Précision" value={form.note} onChange={set('note')} textarea />
              <Fg label="🇧🇪 Note (NL)" value={form.note_nl} onChange={set('note_nl')} textarea />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Fg label="🇫🇷 Texte bouton" value={form.btn_text} onChange={set('btn_text')} placeholder="Prendre Contact" />
                <Fg label="🇧🇪 Texte bouton (NL)" value={form.btn_text_nl} onChange={set('btn_text_nl')} placeholder="Neem contact op" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                <Fg label="Ordre d'affichage" value={form.sort_order} onChange={set('sort_order')} type="number" placeholder="0" />
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="checkbox" id="featured"
                    checked={form.featured}
                    onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="featured" style={{ ...s.label, marginBottom: 0, cursor: 'pointer' }}>
                    Mettre en avant
                  </label>
                </div>
              </div>
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
  cardFeatured: { border: '1px solid rgba(139,158,126,0.4)', background: 'linear-gradient(135deg, var(--sage-pale) 0%, var(--warm-white) 100%)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  cardLabel: { fontSize: '0.95rem', fontWeight: 500, color: 'var(--charcoal)' },
  cardLabelNl: { fontSize: '0.78rem', color: 'var(--mist)', fontStyle: 'italic', marginTop: '0.15rem' },
  price: { fontSize: '1.1rem', fontFamily: 'Cormorant Garamond, serif', color: 'var(--sage)', fontWeight: 400 },
  featuredBadge: { background: 'var(--sage)', color: 'var(--warm-white)', fontSize: '0.62rem', padding: '0.15rem 0.5rem', borderRadius: 10, letterSpacing: '0.05em' },
  cardDesc: { fontSize: '0.83rem', color: 'var(--mist)', lineHeight: 1.6, marginBottom: '0.5rem' },
  note: { fontSize: '0.78rem', color: 'var(--mist)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '1rem' },
  cardActions: { display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(139,158,126,0.1)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,44,44,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: 'var(--warm-white)', borderRadius: 8, padding: '2.5rem', width: 540, maxWidth: '90vw', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  input: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none', boxSizing: 'border-box' },
}
