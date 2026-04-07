import { useEffect, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { supabase } from '../lib/supabase'
import s from './Home.module.css'

const CONTENT_DEFAULTS = {
  hero_title: 'Nancy M.',
  hero_subtitle: 'Nancy M Therapy',
  hero_quote: "On ne fait pas un travail sur soi pour changer, on fait un travail sur soi pour devenir soi-même.",
  hero_tagline: "Life & Love Coaching, Hypnothérapie, Thérapie de couple, EMDR, Sexothérapie et guidance intuitive — une boîte à outils complète pour vous accompagner.",
  about_text_1: "Je suis Nancy M., coach de vie et thérapeute. Ma vocation est de vous accompagner dans votre transformation personnelle, amoureuse et familiale avec bienveillance et précision.",
  about_text_2: "Pour retrouver l'équilibre et le bien-être, contactez-moi. Car j'ai une boîte à outils bien remplie qui ne cesse de s'étoffer.",
  contact_phone: '0495 65 01 30',
  contact_email: 'nancymtherapy@gmail.com',
  cancellation_policy: "Si vous ne pouvez pas assister à votre séance, merci de la déprogrammer au moins 48 heures à l'avance. Dans le cas contraire, elle vous sera facturée.",
  form_active: 'true',
  ticker_items: '',
  ticker_speed: 'normal',
  // NL variants
  hero_title_nl: '',
  hero_subtitle_nl: '',
  hero_quote_nl: '',
  hero_tagline_nl: '',
  about_text_1_nl: '',
  about_text_2_nl: '',
  cancellation_policy_nl: '',
}

const TICKER_DEFAULTS = [
  'Life & Love Coaching', 'Hypnothérapie', 'EMDR',
  'Thérapie de couple & famille', 'Sexothérapie', 'Psycho-Trauma',
  'Guidance intuitive', 'Constellation familiale',
  'Distanciel · Meet · Zoom · WhatsApp',
]

const TICKER_SPEED = { slow: '50s', normal: '30s', fast: '15s' }

export default function Home() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const [siteContent, setSiteContent] = useState(CONTENT_DEFAULTS)
  const [formations, setFormations] = useState([])
  const [formData, setFormData] = useState({ prenom: '', nom: '', email: '', telephone: '', motif: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.from('site_content').select('key, value').then(({ data }) => {
      if (data?.length) {
        const obj = {}
        data.forEach(row => { obj[row.key] = row.value })
        setSiteContent(prev => ({ ...prev, ...obj }))
      }
    })
    supabase.from('formations').select('*').order('year', { ascending: false }).then(({ data }) => {
      setFormations(data || [])
    })
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 80)
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.12 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Helper: returns NL variant if lang=nl and field exists, else FR
  const c = (key) => {
    if (lang === 'nl') {
      const nlVal = siteContent[`${key}_nl`]
      if (nlVal && nlVal.trim()) return nlVal
    }
    return siteContent[key] || CONTENT_DEFAULTS[key] || ''
  }

  const switchLang = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('lang', lng)
  }

  const tickerArr = siteContent.ticker_items
    ? siteContent.ticker_items.split('|').map(t => t.trim()).filter(Boolean)
    : TICKER_DEFAULTS
  const tickerDuration = TICKER_SPEED[siteContent.ticker_speed] || '30s'

  const phone = siteContent.contact_phone || CONTENT_DEFAULTS.contact_phone
  const email = siteContent.contact_email || CONTENT_DEFAULTS.contact_email
  const phoneHref = 'tel:+32' + phone.replace(/\s/g, '').replace(/^0/, '')

  const services = [
    { num: '01', icon: <LifeIcon />, titleKey: 'services.01_title', descKey: 'services.01_desc', tagsKey: 'services.01_tags' },
    { num: '02', icon: <HeartIcon />, titleKey: 'services.02_title', descKey: 'services.02_desc', tagsKey: 'services.02_tags' },
    { num: '03', icon: <HypnoIcon />, titleKey: 'services.03_title', descKey: 'services.03_desc', tagsKey: 'services.03_tags' },
    { num: '04', icon: <CoupleIcon />, titleKey: 'services.04_title', descKey: 'services.04_desc', tagsKey: 'services.04_tags' },
    { num: '05', icon: <EyeIcon />, titleKey: 'services.05_title', descKey: 'services.05_desc', tagsKey: 'services.05_tags' },
    { num: '06', icon: <StarIcon />, titleKey: 'services.06_title', descKey: 'services.06_desc', tagsKey: 'services.06_tags' },
  ]

  const approachSteps = [
    ['01', 'approach.01_title', 'approach.01_desc'],
    ['02', 'approach.02_title', 'approach.02_desc'],
    ['03', 'approach.03_title', 'approach.03_desc'],
    ['04', 'approach.04_title', 'approach.04_desc'],
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setFormError('')
    const { error } = await supabase.from('contacts').insert([{
      first_name: formData.prenom,
      last_name: formData.nom,
      email: formData.email,
      phone: formData.telephone,
      subject: formData.motif,
      message: formData.message,
      read: false,
      created_at: new Date().toISOString(),
    }])
    setSending(false)
    if (error) {
      setFormError('Une erreur est survenue. Merci de réessayer ou de me contacter directement.')
    } else {
      setSent(true)
      setFormData({ prenom: '', nom: '', email: '', telephone: '', motif: '', message: '' })
    }
  }

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div>
      {/* NAV */}
      <nav className={s.nav}>
        <a href="#" className={s.navLogo}>Nancy M <span>Therapy</span></a>
        <ul className={s.navLinks}>
          <li><a href="#about" onClick={e => { e.preventDefault(); scrollTo('about') }}>{t('nav.about')}</a></li>
          <li><a href="#services" onClick={e => { e.preventDefault(); scrollTo('services') }}>{t('nav.services')}</a></li>
          <li><a href="#approche" onClick={e => { e.preventDefault(); scrollTo('approche') }}>{t('nav.approach')}</a></li>
          <li><a href="#tarifs" onClick={e => { e.preventDefault(); scrollTo('tarifs') }}>{t('nav.pricing')}</a></li>
          <li><a href="#contact" onClick={e => { e.preventDefault(); scrollTo('contact') }}>{t('nav.contact')}</a></li>
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={langSwitch}>
            <button style={{ ...langBtn, ...(lang === 'fr' ? langBtnActive : {}) }} onClick={() => switchLang('fr')}>FR</button>
            <span style={{ color: 'rgba(139,158,126,0.4)' }}>|</span>
            <button style={{ ...langBtn, ...(lang === 'nl' ? langBtnActive : {}) }} onClick={() => switchLang('nl')}>NL</button>
          </div>
          <a href="#contact" className={s.navCta} onClick={e => { e.preventDefault(); scrollTo('contact') }}>{t('nav.cta')}</a>
          <button
            className={`${s.hamburger} ${menuOpen ? s.hamburgerOpen : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className={s.mobileMenu}>
          {[['about', t('nav.about')], ['services', t('nav.services')], ['approche', t('nav.approach')], ['tarifs', t('nav.pricing')], ['contact', t('nav.contact')]].map(([id, label]) => (
            <a key={id} href={`#${id}`} className={s.mobileMenuLink}
              onClick={e => { e.preventDefault(); setMenuOpen(false); setTimeout(() => scrollTo(id), 100) }}>
              {label}
            </a>
          ))}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button style={{ ...langBtn, ...(lang === 'fr' ? langBtnActive : {}), fontSize: '1rem' }} onClick={() => switchLang('fr')}>FR</button>
            <button style={{ ...langBtn, ...(lang === 'nl' ? langBtnActive : {}), fontSize: '1rem' }} onClick={() => switchLang('nl')}>NL</button>
          </div>
          <button className={s.mobileMenuCta} onClick={() => { setMenuOpen(false); setTimeout(() => scrollTo('contact'), 100) }}>
            {t('nav.cta')}
          </button>
        </div>
      )}

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.heroBefore} />
        <div className={s.heroLeft}>
          <p className={s.heroEyebrow}>{t('hero.eyebrow')}</p>
          <h1 className={s.heroTitle}>
            <em>{c('hero_subtitle')}</em>
          </h1>
          <p className={s.heroQuote}>« {c('hero_quote')} »</p>
          <p className={s.heroSub}>{c('hero_tagline')}</p>
          <div className={s.heroActions}>
            <a href="#contact" className={s.btnPrimary} onClick={e => { e.preventDefault(); scrollTo('contact') }}>{t('hero.btn_contact')}</a>
            <a href="#services" className={s.btnGhost} onClick={e => { e.preventDefault(); scrollTo('services') }}>{t('hero.btn_services')}</a>
          </div>
        </div>
        <div className={s.heroRight}>
          <div className={s.heroImageWrap}><BotanicalSVG /></div>
          <div className={s.heroQuoteCard}>
            <blockquote>{t('hero.quote_card')}</blockquote>
            <cite>{c('hero_title')}</cite>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className={s.ticker}>
        <div className={s.tickerTrack} style={{ animationDuration: tickerDuration }}>
          {[...tickerArr, ...tickerArr].map((item, i) => (
            <span key={i} className={s.tickerItem}>
              <span className={s.tickerDot} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ABOUT */}
      <section className={s.about} id="about">
        <div className={s.aboutVisual}>
          <div style={{ position: 'relative' }}>
            <div className={s.portraitFrame}>
              <svg style={{ width: 180, opacity: 0.35 }} viewBox="0 0 180 260" fill="none">
                <ellipse cx="90" cy="70" rx="45" ry="50" fill="rgba(139,158,126,0.5)" />
                <path d="M20 260 C20 180 160 180 160 260" fill="rgba(139,158,126,0.4)" />
              </svg>
            </div>
            <div className={s.aboutBadge}><span>8+</span>{t('about.badge')}</div>
          </div>
        </div>
        <div className={`${s.aboutContent} reveal`}>
          <p className={s.eyebrow}>{t('about.eyebrow')}</p>
          <h2 className={s.sectionTitle}>{t('about.title')} <em>{t('about.title_em')}</em></h2>
          <p className={s.text}>{c('about_text_1')}</p>
          <p className={s.text}>{c('about_text_2')}</p>
          <p className={s.text}>
            <Trans i18nKey="about.paragraph3" components={{ strong: <strong /> }} />
          </p>
          <div className={s.signature}>{c('hero_title')}</div>
        </div>
      </section>

      {/* SERVICES */}
      <section className={s.services} id="services">
        <div className={`${s.servicesHeader} reveal`}>
          <p className={`${s.eyebrow} ${s.eyebrowCenter}`}>{t('services.eyebrow')}</p>
          <h2 className={s.sectionTitle}>{t('services.title')} <em>{t('services.title_em')}</em></h2>
          <p className={s.text}>{t('services.subtitle')}</p>
        </div>
        <div className={s.servicesGrid}>
          {services.map(svc => (
            <div key={svc.num} className={`${s.serviceCard} reveal`}>
              <span className={s.serviceNum}>{svc.num}</span>
              <div className={s.serviceIcon}>{svc.icon}</div>
              <h3 className={s.serviceTitle}>{t(svc.titleKey)}</h3>
              <p className={s.serviceDesc}>{t(svc.descKey)}</p>
              <div className={s.serviceTags}>
                {t(svc.tagsKey).split('|').map(tag => (
                  <span key={tag} className={s.serviceTag}>{tag}</span>
                ))}
              </div>
              <a href="#contact" className={s.serviceLink} onClick={e => { e.preventDefault(); scrollTo('contact') }}>{t('services.link')}</a>
            </div>
          ))}
        </div>
      </section>

      {/* DISTANCIEL */}
      <section className={s.distanciel}>
        <div className="reveal">
          <h2 className={s.distancielTitle}>
            {t('distanciel.title_1')} <em>{t('distanciel.title_em')}</em>{t('distanciel.title_2')}
          </h2>
        </div>
        <div className="reveal">
          <p className={s.distancielText}>{t('distanciel.text')}</p>
          <div className={s.platforms}>
            <span className={s.platform}>📹 Google Meet</span>
            <span className={s.platform}>💬 WhatsApp</span>
            <span className={s.platform}>🎥 Zoom</span>
          </div>
          <p className={s.distancielNote}>{t('distanciel.note')}</p>
        </div>
      </section>

      {/* APPROCHE */}
      <section className={s.process} id="approche">
        <div className="reveal">
          <p className={s.eyebrow}>{t('approach.eyebrow')}</p>
          <h2 className={s.sectionTitle}>{t('approach.title')} <em>{t('approach.title_em')}</em></h2>
          <div className={s.processSteps}>
            {approachSteps.map(([num, titleKey, descKey]) => (
              <div key={num} className={s.processStep}>
                <span className={s.stepNum}>{num}</span>
                <div>
                  <h3 className={s.stepTitle}>{t(titleKey)}</h3>
                  <p className={s.stepDesc}>{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${s.processVisual} reveal`}>
          <div className={s.mandala}><div className={s.mandalaCenter}>∞</div></div>
        </div>
      </section>

      {/* FORMATIONS */}
      {formations.length > 0 && (
        <section style={{ padding: '5rem 6rem', background: 'var(--warm-white)' }} id="formations">
          <div className="reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 3rem' }}>
            <p className={`${s.eyebrow} ${s.eyebrowCenter}`}>{t('formations.eyebrow')}</p>
            <h2 className={s.sectionTitle}>{t('formations.title')} <em>{t('formations.title_em')}</em></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', maxWidth: 1100, margin: '0 auto' }}>
            {formations.map(f => {
              const titleDisplay = (lang === 'nl' && f.title_nl) ? f.title_nl : f.title
              const descDisplay = (lang === 'nl' && f.description_nl) ? f.description_nl : f.description
              return (
                <div key={f.id} className="reveal" style={{ background: 'var(--sage-pale)', borderRadius: 6, padding: '2rem', border: '1px solid rgba(139,158,126,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {f.badge && <span style={{ fontSize: '1.4rem' }}>{f.badge}</span>}
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--charcoal)' }}>{titleDisplay}</div>
                        {f.organisation && <div style={{ fontSize: '0.78rem', color: 'var(--mist)', marginTop: '0.15rem' }}>{f.organisation}</div>}
                      </div>
                    </div>
                    {f.year && <span style={{ background: 'var(--warm-white)', color: 'var(--sage)', fontSize: '0.72rem', fontWeight: 500, padding: '0.2rem 0.6rem', borderRadius: 20, flexShrink: 0 }}>{f.year}</span>}
                  </div>
                  {descDisplay && <p style={{ fontSize: '0.83rem', color: 'var(--mist)', lineHeight: 1.6, margin: 0 }}>{descDisplay}</p>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* TARIFS */}
      <section className={s.pricing} id="tarifs">
        <div className="reveal">
          <p className={`${s.eyebrow} ${s.eyebrowCenter}`}>{t('pricing.eyebrow')}</p>
          <h2 className={s.sectionTitle}>{t('pricing.title')} <em>{t('pricing.title_em')}</em> {t('pricing.title_2')}</h2>
          <p className={s.text} style={{ maxWidth: '50ch', margin: '0 auto 3rem' }}>{t('pricing.subtitle')}</p>
        </div>
        <div className={`${s.pricingCards} reveal`}>
          <div className={s.pricingCard}>
            <p className={s.pricingLabel}>{t('pricing.card1_label')}</p>
            <div className={s.pricingPrice}>{t('pricing.card1_price')}</div>
            <p className={s.pricingDetail}>{t('pricing.card1_detail')}</p>
            <p className={s.pricingNote}>{t('pricing.card1_note')}</p>
            <button className={s.btnPricingOutline} onClick={() => scrollTo('contact')}>{t('pricing.card1_btn')}</button>
          </div>
          <div className={`${s.pricingCard} ${s.pricingFeatured}`}>
            <p className={s.pricingLabel}>{t('pricing.card2_label')}</p>
            <div className={s.pricingPrice}>{t('pricing.card2_price')}</div>
            <p className={s.pricingDetail}>{t('pricing.card2_detail')}</p>
            <p className={s.pricingNote}>{t('pricing.card2_note')}</p>
            <button className={s.btnPricingFilled} onClick={() => scrollTo('contact')}>{t('pricing.card2_btn')}</button>
          </div>
        </div>
        <div className={`${s.pricingNotice} reveal`}>
          <strong>{t('pricing.cancellation_title')}</strong><br />
          {c('cancellation_policy')}
        </div>
      </section>

      {/* CONTACT */}
      <section className={s.contact} id="contact">
        <div className="reveal">
          <p className={s.eyebrow}>{t('contact.eyebrow')}</p>
          <h2 className={s.contactTitle}>{t('contact.title')} <em>{t('contact.title_em')}</em></h2>
          <p className={s.text}>{t('contact.subtitle')}</p>
          <div className={s.contactDetails}>
            <div className={s.contactDetail}>
              <div className={s.detailIcon}><PhoneIcon /></div>
              <a href={phoneHref}>{phone}</a>
            </div>
            <div className={s.contactDetail}>
              <div className={s.detailIcon}><MailIcon /></div>
              <a href={`mailto:${email}`}>{email}</a>
            </div>
            <div className={s.contactDetail}>
              <div className={s.detailIcon}><VideoIcon /></div>
              <span>{t('contact.platforms')}</span>
            </div>
          </div>
        </div>

        <form className={`${s.contactForm} reveal`} onSubmit={handleSubmit}>
          {sent ? (
            <div className={s.successMsg}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌿</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.75rem' }}>{t('contact.success_title')}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--mist)' }}>{t('contact.success_text')}</p>
            </div>
          ) : siteContent.form_active === 'false' ? (
            <div className={s.successMsg}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.75rem' }}>{t('contact.disabled_title')}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--mist)' }}>{t('contact.disabled_text')}</p>
            </div>
          ) : (
            <>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>{t('contact.form_firstname')}</label>
                  <input type="text" value={formData.prenom} onChange={e => setFormData(p => ({ ...p, prenom: e.target.value }))} placeholder={t('contact.ph_firstname')} required />
                </div>
                <div className={s.formGroup}>
                  <label>{t('contact.form_lastname')}</label>
                  <input type="text" value={formData.nom} onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))} placeholder={t('contact.ph_lastname')} required />
                </div>
              </div>
              <div className={s.formGroup}>
                <label>{t('contact.form_email')}</label>
                <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder={t('contact.ph_email')} required />
              </div>
              <div className={s.formGroup}>
                <label>{t('contact.form_phone')}</label>
                <input type="tel" value={formData.telephone} onChange={e => setFormData(p => ({ ...p, telephone: e.target.value }))} placeholder={t('contact.ph_phone')} />
              </div>
              <div className={s.formGroup}>
                <label>{t('contact.form_message')}</label>
                <textarea value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} placeholder={t('contact.ph_message')} rows={4} />
              </div>
              {formError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{formError}</p>}
              <button type="submit" className={s.btnSubmit} disabled={sending}>
                {sending ? t('contact.form_sending') : t('contact.form_submit')}
              </button>
            </>
          )}
        </form>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerMain}>
          <div>
            <div className={s.footerLogo}>Nancy M <span>Therapy</span></div>
            <p className={s.footerTagline}>{t('footer.tagline')}</p>
            <p className={s.footerTva}>{t('footer.tva')}</p>
          </div>
          <div className={s.footerCol}>
            <h4>{t('footer.col_activities')}</h4>
            <ul>
              {['Life Coaching', 'Love Coaching', 'Hypnose', 'Thérapie couple', 'Sexothérapie', 'EMDR'].map(l => (
                <li key={l}><a href="#services" onClick={e => { e.preventDefault(); scrollTo('services') }}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div className={s.footerCol}>
            <h4>{t('footer.col_navigation')}</h4>
            <ul>
              {[['about', t('footer.link_about')], ['approche', t('footer.link_approach')], ['tarifs', t('footer.link_pricing')], ['contact', t('footer.link_contact')]].map(([id, label]) => (
                <li key={id}><a href={`#${id}`} onClick={e => { e.preventDefault(); scrollTo(id) }}>{label}</a></li>
              ))}
            </ul>
          </div>
          <div className={s.footerCol}>
            <h4>{t('footer.col_contact')}</h4>
            <ul>
              <li><a href={phoneHref}>{phone}</a></li>
              <li><a href={`mailto:${email}`}>{email}</a></li>
            </ul>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span>{t('footer.copyright')}</span>
          <span>{t('footer.made')}</span>
        </div>
      </footer>
    </div>
  )
}

// Lang switcher styles
const langSwitch = { display: 'flex', alignItems: 'center', gap: '0.3rem' }
const langBtn = { background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--mist)', padding: '0.2rem 0.3rem', transition: 'color 0.2s' }
const langBtnActive = { color: 'var(--charcoal)', fontWeight: 500 }

// Icons
function LifeIcon() { return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="24" r="20"/><path d="M24 12 C24 12 16 18 16 26 C16 30.4 19.6 34 24 34 C28.4 34 32 30.4 32 26 C32 18 24 12 24 12Z"/><line x1="24" y1="34" x2="24" y2="38"/></svg> }
function HeartIcon() { return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M24 40 C14 34 8 26 8 20 C8 14.5 12.5 10 18 10 C21 10 23.8 11.4 24 14 C24.2 11.4 27 10 30 10 C35.5 10 40 14.5 40 20 C40 26 34 34 24 40Z"/></svg> }
function HypnoIcon() { return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="18" r="10"/><path d="M14 28 C10 32 8 38 8 42 L40 42 C40 38 38 32 34 28"/><line x1="24" y1="8" x2="24" y2="5"/></svg> }
function CoupleIcon() { return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="18" cy="20" r="10"/><circle cx="30" cy="28" r="10"/></svg> }
function EyeIcon() { return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 24 C8 24 16 12 24 12 C32 12 40 24 40 24 C40 24 32 36 24 36 C16 36 8 24 8 24Z"/><circle cx="24" cy="24" r="6"/></svg> }
function StarIcon() { return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="24,6 28,17 40,17 30,24 34,35 24,28 14,35 18,24 8,17 20,17"/></svg> }
function PhoneIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-1.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 15z"/></svg> }
function MailIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
function VideoIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> }
function BotanicalSVG() {
  return (
    <svg style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.3 }} viewBox="0 0 500 600" fill="none">
      <path d="M250 550 C250 550 180 450 160 350 C140 250 200 150 250 100" stroke="rgba(139,158,126,0.6)" strokeWidth="1.5" fill="none"/>
      <path d="M250 100 C280 80 320 120 300 160 C280 200 240 180 250 140" stroke="rgba(139,158,126,0.5)" strokeWidth="1" fill="rgba(184,201,173,0.2)"/>
      <path d="M250 200 C210 170 170 200 190 240 C210 280 250 260 250 230" stroke="rgba(139,158,126,0.5)" strokeWidth="1" fill="rgba(184,201,173,0.2)"/>
      <path d="M250 300 C290 270 330 300 310 340 C290 380 250 360 250 330" stroke="rgba(196,137,106,0.4)" strokeWidth="1" fill="rgba(232,187,163,0.2)"/>
      <circle cx="250" cy="90" r="12" stroke="rgba(196,137,106,0.5)" strokeWidth="1" fill="rgba(232,187,163,0.3)"/>
    </svg>
  )
}
