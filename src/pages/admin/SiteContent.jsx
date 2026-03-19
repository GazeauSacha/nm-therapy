import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

const DEFAULTS = {
  hero_title: 'Nancy Massaoudi',
  hero_subtitle: 'NM Therapy',
  hero_tagline: "Life & Love Coaching, Hypnothérapie, Thérapie de couple, EMDR, Sexothérapie et guidance intuitive — une boîte à outils complète pour vous accompagner.",
  hero_quote: "On ne fait pas un travail sur soi pour changer, on fait un travail sur soi pour devenir soi-même.",
  about_text_1: "Je suis Nancy Massaoudi, coach de vie et thérapeute. Ma vocation est de vous accompagner dans votre transformation personnelle, amoureuse et familiale avec bienveillance et précision.",
  about_text_2: "Pour retrouver l'équilibre et le bien-être, contactez-moi. Car j'ai une boîte à outils bien remplie qui ne cesse de s'étoffer.",
  pricing_note: "Séance individuelle : 45 min à 1h30. Tarifs flexibles selon votre situation personnelle et professionnelle.",
  cancellation_policy: "Si vous ne pouvez pas assister à votre séance, merci de la déprogrammer au moins 48 heures à l'avance. Dans le cas contraire, elle vous sera facturée.",
  contact_phone: '0495 65 01 30',
  contact_email: 'nancymtherapy@gmail.com',
  site_visible: 'true',
  form_active: 'true',
}

export default function SiteContent() {
  const [fields, setFields] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('site_content').select('key, value')
      if (data && data.length > 0) {
        const obj = {}
        data.forEach(row => { obj[row.key] = row.value })
        setFields(prev => ({ ...prev, ...obj }))
      }
      setLoading(false)
    }
    load()
  }, [])

  async function saveAll(e) {
    e.preventDefault()
    setSaving(true)
    const rows = Object.entries(fields).map(([key, value]) => ({ key, value }))

    // Upsert all rows
    const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' })
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  const set = (key) => (e) => setFields(prev => ({ ...prev, [key]: e.target.value || e.target.checked?.toString() }))
  const toggle = (key) => () => setFields(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }))

  if (loading) return <div style={{ padding: '3rem', color: 'var(--mist)' }}>Chargement…</div>

  return (
    <div>
      <Topbar title="Contenu du site" subtitle="Modifiez les textes et paramètres affichés sur votre site public." />
      <div style={{ padding: '2rem' }}>
        <form onSubmit={saveAll}>
          <div style={s.grid}>

            {/* Hero */}
            <Section title="Section Hero">
              <Fg label="Nom affiché (titre principal)" value={fields.hero_title} onChange={set('hero_title')} />
              <Fg label="Sous-titre / marque" value={fields.hero_subtitle} onChange={set('hero_subtitle')} />
              <Fg label="Citation hero" value={fields.hero_quote} onChange={set('hero_quote')} textarea />
              <Fg label="Texte descriptif hero" value={fields.hero_tagline} onChange={set('hero_tagline')} textarea />
            </Section>

            {/* À propos */}
            <Section title="À Propos">
              <Fg label="Paragraphe 1" value={fields.about_text_1} onChange={set('about_text_1')} textarea />
              <Fg label="Paragraphe 2" value={fields.about_text_2} onChange={set('about_text_2')} textarea />
            </Section>

            {/* Tarifs & Contact */}
            <Section title="Tarifs & Politique d'annulation">
              <Fg label="Note sur les tarifs" value={fields.pricing_note} onChange={set('pricing_note')} textarea />
              <Fg label="Politique d'annulation" value={fields.cancellation_policy} onChange={set('cancellation_policy')} textarea />
            </Section>

            {/* Contact */}
            <Section title="Coordonnées">
              <Fg label="Téléphone" value={fields.contact_phone} onChange={set('contact_phone')} />
              <Fg label="Email" value={fields.contact_email} onChange={set('contact_email')} />
            </Section>

          </div>

          {/* Toggles */}
          <div style={s.toggleCard}>
            <div style={s.toggleCardTitle}>Paramètres d'affichage</div>
            <div style={s.toggleGrid}>
              <Toggle label="Site en ligne" on={fields.site_visible === 'true'} onClick={toggle('site_visible')} />
              <Toggle label="Formulaire de contact actif" on={fields.form_active === 'true'} onClick={toggle('form_active')} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" style={btn} disabled={saving}>
              {saving ? 'Sauvegarde…' : 'Sauvegarder toutes les modifications'}
            </button>
            {saved && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✓ Modifications sauvegardées !</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

function Fg({ label, value, onChange, textarea }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={s.label}>{label}</label>
      {textarea
        ? <textarea style={{ ...s.input, resize: 'vertical' }} rows={3} value={value} onChange={onChange} />
        : <input type="text" style={s.input} value={value} onChange={onChange} />}
    </div>
  )
}

function Toggle({ label, on, onClick }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
      <div onClick={onClick} style={{ position: 'relative', width: 40, height: 22, background: on ? 'var(--sage)' : 'rgba(139,158,126,0.2)', borderRadius: 11, cursor: 'pointer', transition: 'background 0.3s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <span style={{ fontSize: '0.85rem', color: 'var(--charcoal)' }}>{label}</span>
    </div>
  )
}

const btn = { background: 'var(--sage)', color: 'var(--warm-white)', border: 'none', padding: '0.8rem 2rem', fontFamily: 'Jost, sans-serif', fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer' }

const s = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' },
  section: { background: 'var(--warm-white)', borderRadius: 6, padding: '2rem', border: '1px solid rgba(139,158,126,0.15)' },
  sectionTitle: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--charcoal)', marginBottom: '1.2rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(139,158,126,0.1)', letterSpacing: '0.05em' },
  label: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  input: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none' },
  toggleCard: { background: 'var(--warm-white)', borderRadius: 6, padding: '2rem', border: '1px solid rgba(139,158,126,0.15)' },
  toggleCardTitle: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--charcoal)', marginBottom: '1.2rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(139,158,126,0.1)' },
  toggleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
}
