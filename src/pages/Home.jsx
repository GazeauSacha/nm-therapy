import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import s from './Home.module.css'

const tickerItems = [
  'Life & Love Coaching',
  'Hypnothérapie',
  'EMDR',
  'Thérapie de couple & famille',
  'Sexothérapie',
  'Psycho-Trauma',
  'Guidance intuitive',
  'Constellation familiale',
  'Distanciel · Meet · Zoom · WhatsApp',
]

const services = [
  {
    num: '01', title: 'Life Coaching',
    desc: "Dépasser ses croyances limitantes et prendre conscience de son potentiel pour le développer, à son rythme.",
    tags: ['Burn-out', 'Confiance en soi', 'Motivation', 'Procrastination', 'Gestion de conflits'],
    icon: <LifeIcon />,
  },
  {
    num: '02', title: 'Love Coaching',
    desc: "Pointer les problèmes de la relation amoureuse et proposer de bonnes actions favorisant le retour à une vie sentimentale épanouie.",
    tags: ['Relation amoureuse', 'Confiance', 'Épanouissement'],
    icon: <HeartIcon />,
  },
  {
    num: '03', title: 'Hypnose Thérapeutique',
    desc: "Douleurs chroniques, phobies, addictions, TCA, TSPT et bien d'autres troubles soignés en quelques séances seulement.",
    tags: ['Anxiété', 'Arrêt tabac', 'Perte de poids', 'Traumas', 'Stress', 'Vies antérieures'],
    icon: <HypnoIcon />,
  },
  {
    num: '04', title: 'Thérapie de Couple & Famille',
    desc: "Un parcours balisé de 7 séances (dont 2 individuelles) pour retrouver, pas à pas, la complicité et l'esprit d'équipe.",
    tags: ['Communication', 'Réconciliation', 'Famille', 'Conseillère conjugale'],
    icon: <CoupleIcon />,
  },
  {
    num: '05', title: 'Sexothérapie',
    desc: "Mettre des mots sur les maux et trouver des solutions pour surmonter les difficultés intimes du couple.",
    tags: ['Intimité', 'Libido', 'Couple'],
    icon: <EyeIcon />,
  },
  {
    num: '06', title: 'EMDR & Psycho-Trauma',
    desc: "Traitement des traumatismes psychiques et guidance intuitive ultra précise pour un accompagnement profond.",
    tags: ['EMDR', 'Trauma', 'Guidance intuitive', 'Transgénérationnel'],
    icon: <StarIcon />,
  },
]

export default function Home() {
  const [formData, setFormData] = useState({ prenom: '', nom: '', email: '', telephone: '', motif: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')

  // Scroll reveal
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
      setFormError('Une erreur est survenue. Merci de réessayer ou de me contacter directement par email.')
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
        <a href="#" className={s.navLogo}>NM <span>Therapy</span></a>
        <ul className={s.navLinks}>
          <li><a href="#about" onClick={e => { e.preventDefault(); scrollTo('about') }}>À Propos</a></li>
          <li><a href="#services" onClick={e => { e.preventDefault(); scrollTo('services') }}>Activités</a></li>
          <li><a href="#approche" onClick={e => { e.preventDefault(); scrollTo('approche') }}>Approche</a></li>
          <li><a href="#tarifs" onClick={e => { e.preventDefault(); scrollTo('tarifs') }}>Tarifs</a></li>
          <li><a href="#contact" onClick={e => { e.preventDefault(); scrollTo('contact') }}>Contact</a></li>
        </ul>
        <a href="#contact" className={s.navCta} onClick={e => { e.preventDefault(); scrollTo('contact') }}>Prendre Rendez-vous</a>
      </nav>

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.heroBefore} />
        <div className={s.heroLeft}>
          <p className={s.heroEyebrow}>Coaching Thérapeutique · Hypnose · Thérapie</p>
          <h1 className={s.heroTitle}>
            Nancy Massaoudi<br />
            <em>NM Therapy</em>
          </h1>
          <p className={s.heroQuote}>
            « On ne fait pas un travail sur soi pour changer, on fait un travail sur soi pour devenir soi-même. »
          </p>
          <p className={s.heroSub}>
            Life & Love Coaching, Hypnothérapie, Thérapie de couple, EMDR, Sexothérapie et guidance intuitive — une boîte à outils complète pour vous accompagner.
          </p>
          <div className={s.heroActions}>
            <a href="#contact" className={s.btnPrimary} onClick={e => { e.preventDefault(); scrollTo('contact') }}>Prendre contact</a>
            <a href="#services" className={s.btnGhost} onClick={e => { e.preventDefault(); scrollTo('services') }}>Mes activités</a>
          </div>
        </div>
        <div className={s.heroRight}>
          <div className={s.heroImageWrap}>
            <BotanicalSVG />
          </div>
          <div className={s.heroQuoteCard}>
            <blockquote>« Devenir soi-même est le plus beau des voyages. »</blockquote>
            <cite>Nancy Massaoudi</cite>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className={s.ticker}>
        <div className={s.tickerTrack}>
          {[...tickerItems, ...tickerItems].map((item, i) => (
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
            <div className={s.aboutBadge}><span>8+</span>outils<br />thérapeutiques</div>
          </div>
        </div>
        <div className={`${s.aboutContent} reveal`}>
          <p className={s.eyebrow}>À Propos</p>
          <h2 className={s.sectionTitle}>Une thérapeute à votre <em>écoute</em></h2>
          <p className={s.text}>Je suis Nancy Massaoudi, coach de vie et thérapeute. Ma vocation est de vous accompagner dans votre transformation personnelle, amoureuse et familiale avec bienveillance et précision.</p>
          <p className={s.text}>Pour retrouver l'équilibre et le bien-être, contactez-moi. Car j'ai une boîte à outils bien remplie qui ne cesse de s'étoffer — du coaching de vie à la guidance intuitive, en passant par l'EMDR et l'hypnose thérapeutique.</p>
          <p className={s.text}>Je reçois <strong>uniquement en distanciel</strong> via Meet, WhatsApp, Zoom — des créneaux en présentiel peuvent être organisés selon les besoins.</p>
          <div className={s.signature}>Nancy Massaoudi</div>
        </div>
      </section>

      {/* SERVICES */}
      <section className={s.services} id="services">
        <div className={`${s.servicesHeader} reveal`}>
          <p className={`${s.eyebrow} ${s.eyebrowCenter}`}>Mes Activités</p>
          <h2 className={s.sectionTitle}>Des outils pour <em>chaque chemin</em></h2>
          <p className={s.text}>Une approche holistique et pluridisciplinaire pour vous accompagner là où vous en avez besoin.</p>
        </div>
        <div className={s.servicesGrid}>
          {services.map(svc => (
            <div key={svc.num} className={`${s.serviceCard} reveal`}>
              <span className={s.serviceNum}>{svc.num}</span>
              <div className={s.serviceIcon}>{svc.icon}</div>
              <h3 className={s.serviceTitle}>{svc.title}</h3>
              <p className={s.serviceDesc}>{svc.desc}</p>
              <div className={s.serviceTags}>{svc.tags.map(t => <span key={t} className={s.serviceTag}>{t}</span>)}</div>
              <a href="#contact" className={s.serviceLink} onClick={e => { e.preventDefault(); scrollTo('contact') }}>Prendre contact</a>
            </div>
          ))}
        </div>
      </section>

      {/* DISTANCIEL */}
      <section className={s.distanciel}>
        <div className="reveal">
          <h2 className={s.distancielTitle}>Séances <em>100% à distance</em>,<br />où que vous soyez</h2>
        </div>
        <div className="reveal">
          <p className={s.distancielText}>Je vous reçois uniquement en distanciel pour vous offrir la flexibilité dont vous avez besoin. Choisissez la plateforme qui vous convient.</p>
          <div className={s.platforms}>
            <span className={s.platform}>📹 Google Meet</span>
            <span className={s.platform}>💬 WhatsApp</span>
            <span className={s.platform}>🎥 Zoom</span>
          </div>
          <p className={s.distancielNote}>Si une véritable session en présentiel est nécessaire, un créneau sera libéré au cas par cas selon les besoins.</p>
        </div>
      </section>

      {/* APPROCHE */}
      <section className={s.process} id="approche">
        <div className="reveal">
          <p className={s.eyebrow}>Ma Démarche</p>
          <h2 className={s.sectionTitle}>Un chemin en quatre <em>étapes fondatrices</em></h2>
          <div className={s.processSteps}>
            {[
              ['01', 'Écoute & Exploration', "Un premier espace d'accueil pour nommer ce qui vous pèse, identifier vos besoins profonds et co-construire vos objectifs."],
              ['02', 'Prise de Conscience', "Exploration des schémas émotionnels. Mise en lumière de vos croyances limitantes et de vos ressources cachées."],
              ['03', 'Transformation Active', "Mise en œuvre des outils adaptés : hypnose, EMDR, coaching, guidance intuitive, constellation familiale."],
              ['04', 'Ancrage & Autonomie', "Consolidation des acquis pour des changements naturels et durables. Vous repartez avec votre propre boîte à outils."],
            ].map(([num, title, desc]) => (
              <div key={num} className={s.processStep}>
                <span className={s.stepNum}>{num}</span>
                <div><h3 className={s.stepTitle}>{title}</h3><p className={s.stepDesc}>{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${s.processVisual} reveal`}>
          <div className={s.mandala}><div className={s.mandalaCenter}>∞</div></div>
        </div>
      </section>

      {/* TARIFS */}
      <section className={s.pricing} id="tarifs">
        <div className="reveal">
          <p className={`${s.eyebrow} ${s.eyebrowCenter}`}>Tarifs</p>
          <h2 className={s.sectionTitle}>Des tarifs <em>flexibles</em> selon votre situation</h2>
          <p className={s.text} style={{ maxWidth: '50ch', margin: '0 auto 3rem' }}>Adaptés en fonction de votre situation personnelle et professionnelle.</p>
        </div>
        <div className={`${s.pricingCards} reveal`}>
          <div className={s.pricingCard}>
            <p className={s.pricingLabel}>Séance individuelle</p>
            <div className={s.pricingPrice}>Sur devis</div>
            <p className={s.pricingDetail}>Entre 45 min et 1h30 selon le besoin et l'approche utilisée (coaching, hypnose, EMDR, guidance…)</p>
            <p className={s.pricingNote}>Tarif adapté à votre situation — discutons-en lors d'un premier échange.</p>
            <button className={s.btnPricingOutline} onClick={() => scrollTo('contact')}>Demander un devis</button>
          </div>
          <div className={`${s.pricingCard} ${s.pricingFeatured}`}>
            <p className={s.pricingLabel}>Thérapie de couple</p>
            <div className={s.pricingPrice}>7 séances</div>
            <p className={s.pricingDetail}>Programme incluant 7 séances (dont 2 individuelles) pour retrouver la complicité et reconstruire une vraie équipe.</p>
            <p className={s.pricingNote}>Tarif communiqué lors du premier contact.</p>
            <button className={s.btnPricingFilled} onClick={() => scrollTo('contact')}>Prendre contact</button>
          </div>
        </div>
        <div className={`${s.pricingNotice} reveal`}>
          <strong>⚠ Politique d'annulation</strong><br />
          Si vous ne pouvez pas assister à votre séance, merci de la déprogrammer au moins <strong>48 heures à l'avance</strong>. Dans le cas contraire, elle vous sera facturée.
        </div>
      </section>

      {/* CONTACT */}
      <section className={s.contact} id="contact">
        <div className="reveal">
          <p className={s.eyebrow}>Contact</p>
          <h2 className={s.contactTitle}>Votre chemin commence <em>ici</em></h2>
          <p className={s.text}>Remplissez le formulaire ou contactez-moi directement.</p>
          <div className={s.contactDetails}>
            <div className={s.contactDetail}>
              <div className={s.detailIcon}><PhoneIcon /></div>
              <a href="tel:+32495650130">0495 65 01 30</a>
            </div>
            <div className={s.contactDetail}>
              <div className={s.detailIcon}><MailIcon /></div>
              <a href="mailto:nancymtherapy@gmail.com">nancymtherapy@gmail.com</a>
            </div>
            <div className={s.contactDetail}>
              <div className={s.detailIcon}><VideoIcon /></div>
              <span>Meet · WhatsApp · Zoom</span>
            </div>
          </div>
        </div>

        <form className={`${s.contactForm} reveal`} onSubmit={handleSubmit}>
          {sent ? (
            <div className={s.successMsg}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌿</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.75rem' }}>Message envoyé !</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--mist)' }}>Nancy vous recontactera dans les meilleurs délais.</p>
            </div>
          ) : (
            <>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label>Prénom</label>
                  <input type="text" value={formData.prenom} onChange={e => setFormData(p => ({ ...p, prenom: e.target.value }))} placeholder="Votre prénom" required />
                </div>
                <div className={s.formGroup}>
                  <label>Nom</label>
                  <input type="text" value={formData.nom} onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))} placeholder="Votre nom" required />
                </div>
              </div>
              <div className={s.formGroup}>
                <label>Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="votre@email.com" required />
              </div>
              <div className={s.formGroup}>
                <label>Téléphone</label>
                <input type="tel" value={formData.telephone} onChange={e => setFormData(p => ({ ...p, telephone: e.target.value }))} placeholder="0495 XX XX XX" />
              </div>
              <div className={s.formGroup}>
                <label>Motif de la demande</label>
                <select value={formData.motif} onChange={e => setFormData(p => ({ ...p, motif: e.target.value }))}>
                  <option value="">Choisissez un accompagnement...</option>
                  <option>Life Coaching</option>
                  <option>Love Coaching</option>
                  <option>Hypnose Thérapeutique</option>
                  <option>Thérapie de couple / famille</option>
                  <option>Sexothérapie</option>
                  <option>EMDR / Psycho-Trauma</option>
                  <option>Guidance intuitive</option>
                  <option>Je ne sais pas encore</option>
                </select>
              </div>
              <div className={s.formGroup}>
                <label>Message</label>
                <textarea value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} placeholder="Partagez brièvement ce qui vous amène…" rows={4} />
              </div>
              {formError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{formError}</p>}
              <button type="submit" className={s.btnSubmit} disabled={sending}>
                {sending ? 'Envoi en cours…' : 'Envoyer ma demande'}
              </button>
            </>
          )}
        </form>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerMain}>
          <div>
            <div className={s.footerLogo}>NM <span>Therapy</span></div>
            <p className={s.footerTagline}>Nancy Massaoudi — Coaching, hypnothérapie, thérapie de couple et guidance intuitive en distanciel.</p>
            <p className={s.footerTva}>TVA / BTW : BE0749.913.631</p>
          </div>
          <div className={s.footerCol}>
            <h4>Activités</h4>
            <ul>
              {['Life Coaching', 'Love Coaching', 'Hypnose', 'Thérapie couple', 'Sexothérapie', 'EMDR'].map(l => <li key={l}><a href="#services" onClick={e => { e.preventDefault(); scrollTo('services') }}>{l}</a></li>)}
            </ul>
          </div>
          <div className={s.footerCol}>
            <h4>Navigation</h4>
            <ul>
              {[['about','À propos'],['approche','Démarche'],['tarifs','Tarifs'],['contact','Contact']].map(([id, label]) => (
                <li key={id}><a href={`#${id}`} onClick={e => { e.preventDefault(); scrollTo(id) }}>{label}</a></li>
              ))}
            </ul>
          </div>
          <div className={s.footerCol}>
            <h4>Contact</h4>
            <ul>
              <li><a href="tel:+32495650130">0495 65 01 30</a></li>
              <li><a href="mailto:nancymtherapy@gmail.com">nancymtherapy@gmail.com</a></li>
            </ul>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span>© 2024 NM Therapy — Nancy Massaoudi</span>
          <span>Fait avec soin 🌿</span>
        </div>
      </footer>
    </div>
  )
}

// ── Icons ──
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
    <svg style={{ position:'absolute', width:'100%', height:'100%', opacity:0.3 }} viewBox="0 0 500 600" fill="none">
      <path d="M250 550 C250 550 180 450 160 350 C140 250 200 150 250 100" stroke="rgba(139,158,126,0.6)" strokeWidth="1.5" fill="none"/>
      <path d="M250 100 C280 80 320 120 300 160 C280 200 240 180 250 140" stroke="rgba(139,158,126,0.5)" strokeWidth="1" fill="rgba(184,201,173,0.2)"/>
      <path d="M250 200 C210 170 170 200 190 240 C210 280 250 260 250 230" stroke="rgba(139,158,126,0.5)" strokeWidth="1" fill="rgba(184,201,173,0.2)"/>
      <path d="M250 300 C290 270 330 300 310 340 C290 380 250 360 250 330" stroke="rgba(196,137,106,0.4)" strokeWidth="1" fill="rgba(232,187,163,0.2)"/>
      <circle cx="250" cy="90" r="12" stroke="rgba(196,137,106,0.5)" strokeWidth="1" fill="rgba(232,187,163,0.3)"/>
    </svg>
  )
}
