import { useEffect, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'

interface SiteFields {
  hero_title: string; hero_subtitle: string; hero_quote: string; hero_tagline: string;
  about_text_1: string; about_text_2: string;
  cancellation_policy: string; pricing_note: string;
  contact_phone: string; contact_email: string;
  site_visible: string; form_active: string;
  ticker_items: string; ticker_speed: string;
  hero_title_nl: string; hero_subtitle_nl: string; hero_quote_nl: string; hero_tagline_nl: string;
  about_text_1_nl: string; about_text_2_nl: string; cancellation_policy_nl: string;
}

const DEFAULTS: SiteFields = {
  hero_title: 'Nancy M.',
  hero_subtitle: 'Nancy M Therapy',
  hero_quote: "On ne fait pas un travail sur soi pour changer, on fait un travail sur soi pour devenir soi-même.",
  hero_tagline: "Life & Love Coaching, Hypnothérapie, Thérapie de couple, EMDR, Sexothérapie et guidance intuitive — une boîte à outils complète pour vous accompagner.",
  about_text_1: "Je suis Nancy M., coach de vie et thérapeute. Ma vocation est de vous accompagner dans votre transformation personnelle, amoureuse et familiale avec bienveillance et précision.",
  about_text_2: "Pour retrouver l'équilibre et le bien-être, contactez-moi. Car j'ai une boîte à outils bien remplie qui ne cesse de s'étoffer.",
  cancellation_policy: "Si vous ne pouvez pas assister à votre séance, merci de la déprogrammer au moins 48 heures à l'avance. Dans le cas contraire, elle vous sera facturée.",
  pricing_note: "Séance individuelle : 45 min à 1h30. Tarifs flexibles selon votre situation personnelle et professionnelle.",
  contact_phone: '0495 65 01 30',
  contact_email: 'nancymtherapy@gmail.com',
  site_visible: 'true',
  form_active: 'true',
  ticker_items: 'Life & Love Coaching|Hypnothérapie|EMDR|Thérapie de couple & famille|Sexothérapie|Psycho-Trauma|Guidance intuitive|Constellation familiale|Distanciel · Meet · Zoom · WhatsApp',
  ticker_speed: 'normal',
  hero_title_nl: '', hero_subtitle_nl: '', hero_quote_nl: '', hero_tagline_nl: '',
  about_text_1_nl: '', about_text_2_nl: '', cancellation_policy_nl: '',
}

export default function SiteContent() {
  const [fields, setFields] = useState<SiteFields>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [langTab, setLangTab] = useState('fr')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('site_content').select('key, value')
      if (data && data.length > 0) {
        const obj: Record<string, string> = {}
        data.forEach(row => { obj[row.key] = row.value })
        setFields(prev => ({ ...prev, ...obj }))
      }
      setLoading(false)
    }
    load()
  }, [])

  async function saveAll(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const rows = Object.entries(fields).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' })
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  const set = (key: keyof SiteFields) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFields(prev => ({ ...prev, [key]: e.target.value }))

  const toggle = (key: keyof SiteFields) => () =>
    setFields(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }))

  if (loading) return <div style={{ padding: '3rem', color: 'var(--mist)' }}>Chargement…</div>

  const isFr = langTab === 'fr'

  return (
    <div>
      <Topbar title="Contenu du site" subtitle="Modifiez les textes affichés sur votre site public." />
      <div style={{ padding: '2rem' }}>

        <div style={s.langTabs}>
          <button style={{ ...s.langTab, ...(isFr ? s.langTabActive : {}) }} onClick={() => setLangTab('fr')} type="button">🇫🇷 Français</button>
          <button style={{ ...s.langTab, ...(!isFr ? s.langTabActive : {}) }} onClick={() => setLangTab('nl')} type="button">🇧🇪 Nederlands</button>
          {!isFr && <span style={{ fontSize: '0.75rem', color: 'var(--mist)', fontStyle: 'italic', marginLeft: '0.5rem' }}>Laissez vide pour utiliser le texte FR par défaut</span>}
        </div>

        <form onSubmit={saveAll}>
          <div style={s.grid}>

            <Section title={isFr ? 'Section Hero (FR)' : 'Section Hero (NL)'}>
              <Fg label="Nom affiché (titre principal)" value={isFr ? fields.hero_title : fields.hero_title_nl} onChange={set(isFr ? 'hero_title' : 'hero_title_nl')} />
              <Fg label="Sous-titre / marque" value={isFr ? fields.hero_subtitle : fields.hero_subtitle_nl} onChange={set(isFr ? 'hero_subtitle' : 'hero_subtitle_nl')} />
              <Fg label="Citation hero" value={isFr ? fields.hero_quote : fields.hero_quote_nl} onChange={set(isFr ? 'hero_quote' : 'hero_quote_nl')} textarea />
              <Fg label="Texte descriptif hero" value={isFr ? fields.hero_tagline : fields.hero_tagline_nl} onChange={set(isFr ? 'hero_tagline' : 'hero_tagline_nl')} textarea />
            </Section>

            <Section title={isFr ? 'À Propos (FR)' : 'À Propos (NL)'}>
              <Fg label="Paragraphe 1" value={isFr ? fields.about_text_1 : fields.about_text_1_nl} onChange={set(isFr ? 'about_text_1' : 'about_text_1_nl')} textarea />
              <Fg label="Paragraphe 2" value={isFr ? fields.about_text_2 : fields.about_text_2_nl} onChange={set(isFr ? 'about_text_2' : 'about_text_2_nl')} textarea />
            </Section>

            {isFr && (
              <Section title="Bandeau défilant (ticker)">
                <Fg label="Phrases du ticker (séparées par |)" value={fields.ticker_items} onChange={set('ticker_items')} textarea />
                <div style={{ marginBottom: '1rem' }}>
                  <label style={s.label}>Vitesse de défilement</label>
                  <select style={s.input} value={fields.ticker_speed} onChange={set('ticker_speed')}>
                    <option value="slow">Lent</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Rapide</option>
                  </select>
                </div>
              </Section>
            )}

            <Section title={isFr ? "Politique d'annulation (FR)" : "Annuleringsbeleid (NL)"}>
              {isFr && <Fg label="Note sur les tarifs" value={fields.pricing_note} onChange={set('pricing_note')} textarea />}
              <Fg
                label={isFr ? "Politique d'annulation" : "Annuleringsbeleid"}
                value={isFr ? fields.cancellation_policy : fields.cancellation_policy_nl}
                onChange={set(isFr ? 'cancellation_policy' : 'cancellation_policy_nl')}
                textarea
              />
            </Section>

            {isFr && (
              <Section title="Coordonnées">
                <Fg label="Téléphone" value={fields.contact_phone} onChange={set('contact_phone')} />
                <Fg label="Email" value={fields.contact_email} onChange={set('contact_email')} />
              </Section>
            )}
          </div>

          {isFr && (
            <div style={s.toggleCard}>
              <div style={s.toggleCardTitle}>Paramètres d'affichage</div>
              <div style={s.toggleGrid}>
                <Toggle label="Site en ligne" on={fields.site_visible === 'true'} onClick={toggle('site_visible')} />
                <Toggle label="Formulaire de contact actif" on={fields.form_active === 'true'} onClick={toggle('form_active')} />
              </div>
            </div>
          )}

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

interface FgProps {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  textarea?: boolean
}

function Fg({ label, value, onChange, textarea }: FgProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={s.label}>{label}</label>
      {textarea
        ? <textarea style={{ ...s.input, resize: 'vertical' }} rows={3} value={value || ''} onChange={onChange} />
        : <input type="text" style={s.input} value={value || ''} onChange={onChange} />}
    </div>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
      <div onClick={onClick} style={{ position: 'relative', width: 40, height: 22, background: on ? 'var(--sage)' : 'rgba(139,158,126,0.2)', borderRadius: 11, cursor: 'pointer', transition: 'background 0.3s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <span style={{ fontSize: '0.85rem', color: 'var(--charcoal)' }}>{label}</span>
    </div>
  )
}

const btn: CSSProperties = { background: 'var(--sage)', color: 'var(--warm-white)', border: 'none', padding: '0.8rem 2rem', fontFamily: 'Jost, sans-serif', fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer' }

const s: Record<string, CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' },
  section: { background: 'var(--warm-white)', borderRadius: 6, padding: '2rem', border: '1px solid rgba(139,158,126,0.15)' },
  sectionTitle: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--charcoal)', marginBottom: '1.2rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(139,158,126,0.1)', letterSpacing: '0.05em' },
  label: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  input: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none' },
  toggleCard: { background: 'var(--warm-white)', borderRadius: 6, padding: '2rem', border: '1px solid rgba(139,158,126,0.15)' },
  toggleCardTitle: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--charcoal)', marginBottom: '1.2rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(139,158,126,0.1)' },
  toggleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
  langTabs: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' },
  langTab: { background: 'transparent', border: '1px solid rgba(139,158,126,0.3)', borderRadius: 4, padding: '0.5rem 1.2rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--mist)', transition: 'all 0.2s' },
  langTabActive: { background: 'var(--charcoal)', color: 'var(--warm-white)', borderColor: 'var(--charcoal)' },
}
