import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Trans } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useContent, populateDbContent } from "../hooks/useContent";

interface SiteContent {
  hero_title: string;
  hero_subtitle: string;
  hero_quote: string;
  hero_tagline: string;
  about_text_1: string;
  about_text_2: string;
  contact_phone: string;
  contact_email: string;
  cancellation_policy: string;
  form_active: string;
  ticker_items: string;
  ticker_items_nl: string;
  ticker_speed: string;
  hero_title_nl: string;
  hero_subtitle_nl: string;
  hero_quote_nl: string;
  hero_tagline_nl: string;
  about_text_1_nl: string;
  about_text_2_nl: string;
  cancellation_policy_nl: string;
}

interface FormData {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  motif: string;
  message: string;
}

const CONTENT_DEFAULTS: SiteContent = {
  hero_title: "Nancy M.",
  hero_subtitle: "Nancy M Therapy",
  hero_quote:
    "On ne fait pas un travail sur soi pour changer, on fait un travail sur soi pour devenir soi-même.",
  hero_tagline:
    "Life & Love Coaching, Hypnothérapie, Thérapie de couple, EMDR, Sexothérapie et guidance intuitive — une boîte à outils complète pour vous accompagner.",
  about_text_1:
    "Je suis Nancy M., coach de vie et thérapeute. Ma vocation est de vous accompagner dans votre transformation personnelle, amoureuse et familiale avec bienveillance et précision.",
  about_text_2:
    "Pour retrouver l'équilibre et le bien-être, contactez-moi. Car j'ai une boîte à outils bien remplie qui ne cesse de s'étoffer.",
  contact_phone: "0495 65 01 30",
  contact_email: "nancymtherapy@gmail.com",
  cancellation_policy:
    "Si vous ne pouvez pas assister à votre séance, merci de la déprogrammer au moins 48 heures à l'avance. Dans le cas contraire, elle vous sera facturée.",
  form_active: "true",
  ticker_items: "",
  ticker_items_nl: "",
  ticker_speed: "normal",
  hero_title_nl: "",
  hero_subtitle_nl: "",
  hero_quote_nl: "",
  hero_tagline_nl: "",
  about_text_1_nl: "",
  about_text_2_nl: "",
  cancellation_policy_nl: "",
};

const TICKER_DEFAULTS = [
  "Life & Love Coaching",
  "Hypnothérapie",
  "EMDR",
  "Thérapie de couple & famille",
  "Sexothérapie",
  "Psycho-Trauma",
  "Guidance intuitive",
  "Constellation familiale",
  "Distanciel · Meet · Zoom · WhatsApp",
];

const TICKER_SPEED: Record<string, string> = {
  slow: "50s",
  normal: "30s",
  fast: "15s",
};

const approachSteps = [
  {
    num: "01",
    titleKey: "approach.01_title",
    descKey: "approach.01_desc",
    titleDefault: "Écoute & Exploration",
    descDefault:
      "Un premier espace d'accueil pour nommer ce qui vous pèse, identifier vos besoins profonds et co-construire vos objectifs.",
  },
  {
    num: "02",
    titleKey: "approach.02_title",
    descKey: "approach.02_desc",
    titleDefault: "Prise de Conscience",
    descDefault:
      "Exploration des schémas émotionnels. Mise en lumière de vos croyances limitantes et de vos ressources cachées.",
  },
  {
    num: "03",
    titleKey: "approach.03_title",
    descKey: "approach.03_desc",
    titleDefault: "Transformation Active",
    descDefault:
      "Mise en œuvre des outils adaptés : hypnose, EMDR, coaching, guidance intuitive, constellation familiale.",
  },
  {
    num: "04",
    titleKey: "approach.04_title",
    descKey: "approach.04_desc",
    titleDefault: "Ancrage & Autonomie",
    descDefault:
      "Consolidation des acquis pour des changements naturels et durables. Vous repartez avec votre propre boîte à outils.",
  },
] as const;

export default function Home() {
  const { c, i18n } = useContent();
  const lang = i18n.language;

  const [siteContent, setSiteContent] = useState<SiteContent>(CONTENT_DEFAULTS);
  const [formations, setFormations] = useState<any[] | null>(null);
  const [activities, setActivities] = useState<any[] | null>(null);
  const [offers, setOffers] = useState<any[] | null>(null);
  const [formData, setFormData] = useState<FormData>({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    motif: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("key, value")
      .then(({ data }) => {
        if (data?.length) {
          const obj: Record<string, string> = {};
          data.forEach((row) => {
            obj[row.key] = row.value;
          });
          setSiteContent((prev) => ({ ...prev, ...obj }));
          populateDbContent(obj);
        }
      });
    supabase
      .from("formations")
      .select("*")
      .order("year", { ascending: false })
      .then(({ data }) => {
        setFormations(data || []);
      });
    supabase
      .from("activities")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setActivities(data || []);
      });
    supabase
      .from("offers")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setOffers(data || []);
      });
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("visible"), i * 80);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [activities, offers, formations]);

  const nlField = (item: any, field: string): string => {
    if (lang === "nl") {
      const v = item[`${field}_nl`];
      if (v && v.trim()) return v;
    }
    return item[field] || "";
  };

  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  const tickerSource =
    lang === "nl" && siteContent.ticker_items_nl?.trim()
      ? siteContent.ticker_items_nl
      : siteContent.ticker_items;
  const tickerArr = tickerSource
    ? tickerSource.split("|").map((item) => item.trim()).filter(Boolean)
    : TICKER_DEFAULTS;
  const tickerDuration = TICKER_SPEED[siteContent.ticker_speed] || "30s";

  const phone = c("contact_phone", CONTENT_DEFAULTS.contact_phone);
  const email = c("contact_email", CONTENT_DEFAULTS.contact_email);
  const phoneHref = "tel:+32" + phone.replace(/\s/g, "").replace(/^0/, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFormError("");
    try {
      const res = await fetch("/api/submit-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.prenom,
          last_name: formData.nom,
          email: formData.email,
          phone: formData.telephone,
          subject: formData.motif,
          message: formData.message,
        }),
      });
      if (!res.ok) throw new Error("server error");
      setSent(true);
      setFormData({ prenom: "", nom: "", email: "", telephone: "", motif: "", message: "" });
    } catch {
      setFormError("Une erreur est survenue. Merci de réessayer ou de me contacter directement.");
    } finally {
      setSending(false);
    }
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div>
      {/* NAV */}
      <header>
        <nav className="nav">
          <a href="#" className="navLogo">
            Nancy M <span>Therapy</span>
          </a>
          <ul className="navLinks">
            <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo("about"); }}>{c("nav.about", "À Propos")}</a></li>
            {(activities === null || activities.length > 0) && (
              <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollTo("services"); }}>{c("nav.services", "Activités")}</a></li>
            )}
            <li><a href="#approche" onClick={(e) => { e.preventDefault(); scrollTo("approche"); }}>{c("nav.approach", "Approche")}</a></li>
            {(offers === null || offers.length > 0) && (
              <li><a href="#tarifs" onClick={(e) => { e.preventDefault(); scrollTo("tarifs"); }}>{c("nav.pricing", "Tarifs")}</a></li>
            )}
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo("contact"); }}>{c("nav.contact", "Contact")}</a></li>
          </ul>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={langSwitch}>
              <button
                style={{ ...langBtn, ...(lang === "fr" ? langBtnActive : {}) }}
                onClick={() => switchLang("fr")}
              >
                FR
              </button>
              <span style={{ color: "rgba(139,158,126,0.4)" }}>|</span>
              <button
                style={{ ...langBtn, ...(lang === "nl" ? langBtnActive : {}) }}
                onClick={() => switchLang("nl")}
              >
                NL
              </button>
            </div>
            <a
              href="#contact"
              className="navCta"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("contact");
              }}
            >
              {c("nav.cta", "Prendre Rendez-vous")}
            </a>
            <button
              className={`hamburger${menuOpen ? " hamburgerOpen" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>
      </header>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobileMenu">
          {[
            ["about", c("nav.about", "À Propos"), true],
            ["services", c("nav.services", "Activités"), activities === null || activities.length > 0],
            ["approche", c("nav.approach", "Approche"), true],
            ["tarifs", c("nav.pricing", "Tarifs"), offers === null || offers.length > 0],
            ["contact", c("nav.contact", "Contact"), true],
          ].filter(([,, show]) => show).map(([id, label]) => (
            <a
              key={id as string}
              href={`#${id}`}
              className="mobileMenuLink"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setTimeout(() => scrollTo(id as string), 100);
              }}
            >
              {label}
            </a>
          ))}
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <button
              style={{
                ...langBtn,
                ...(lang === "fr" ? langBtnActive : {}),
                fontSize: "1rem",
              }}
              onClick={() => switchLang("fr")}
            >
              FR
            </button>
            <button
              style={{
                ...langBtn,
                ...(lang === "nl" ? langBtnActive : {}),
                fontSize: "1rem",
              }}
              onClick={() => switchLang("nl")}
            >
              NL
            </button>
          </div>
          <button
            className="mobileMenuCta"
            onClick={() => {
              setMenuOpen(false);
              setTimeout(() => scrollTo("contact"), 100);
            }}
          >
            {c("nav.cta", "Prendre Rendez-vous")}
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main>
        {/* HERO */}
        <section className="hero">
          <div className="heroBefore" />
          <div className="heroLeft">
            <p className="heroEyebrow">{c("hero.eyebrow", "Coaching Thérapeutique")}</p>
            <h1 className="heroTitle">
              <em>{c("hero_subtitle", CONTENT_DEFAULTS.hero_subtitle)}</em>
            </h1>
            <p className="heroQuote">« {c("hero_quote", CONTENT_DEFAULTS.hero_quote)} »</p>
            <p className="heroSub">{c("hero_tagline", CONTENT_DEFAULTS.hero_tagline)}</p>
            <div className="heroActions">
              <a
                href="#contact"
                className="btnPrimary"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("contact");
                }}
              >
                {c("hero.btn_contact", "Prendre contact")}
              </a>
              <a
                href="#services"
                className="btnGhost"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("services");
                }}
              >
                {c("hero.btn_services", "Mes activités")}
              </a>
            </div>
          </div>
          <div className="heroRight">
            <div className="heroImageWrap">
              <BotanicalSVG />
            </div>
            {/* <div className="heroQuoteCard">
              <blockquote>{c("hero.quote_card", "« Devenir soi-même est le plus beau des voyages. »")}</blockquote>
              <cite>{c("hero_title", CONTENT_DEFAULTS.hero_title)}</cite>
            </div> */}
          </div>
        </section>

        {/* TICKER */}
        <div className="ticker">
          <div
            className="tickerTrack"
            style={{ animationDuration: tickerDuration }}
          >
            {[...tickerArr, ...tickerArr].map((item, i) => (
              <span key={i} className="tickerItem">
                <span className="tickerDot" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ABOUT */}
        <section className="about" id="about">
          <div className="aboutVisual">
            <div style={{ position: "relative" }}>
              <div className="portraitFrame">
                <img
                  src="/image/image1.jpeg"
                  alt="Nancy M, coach et thérapeute"
                  width="440"
                  height="660"
                />
              </div>
              <div className="aboutBadge">
                <span>8+</span>
                {c("about.badge", "outils\nthérapeutiques")}
              </div>
            </div>
          </div>
          <div className="aboutContent reveal">
            <p className="eyebrow">{c("about.eyebrow", "À Propos")}</p>
            <h2 className="sectionTitle">
              {c("about.title", "Une thérapeute à votre")} <em>{c("about.title_em", "écoute")}</em>
            </h2>
            <p className="text">{c("about_text_1", CONTENT_DEFAULTS.about_text_1)}</p>
            <p className="text">{c("about_text_2", CONTENT_DEFAULTS.about_text_2)}</p>
            <p className="text">
              <Trans
                i18nKey="about.paragraph3"
                components={{ strong: <strong /> }}
              />
            </p>
            <div className="signature">{c("hero_title", CONTENT_DEFAULTS.hero_title)}</div>
          </div>
        </section>

        {/* SERVICES */}
        {activities && activities.length > 0 && (
          <section className="services" id="services">
            <div className="servicesHeader reveal">
              <p className="eyebrow eyebrowCenter">{c("services.eyebrow", "Mes Activités")}</p>
              <h2 className="sectionTitle">
                {c("services.title", "Des outils pour")} <em>{c("services.title_em", "chaque chemin")}</em>
              </h2>
              <p className="text">{c("services.subtitle", "Une approche holistique et pluridisciplinaire pour vous accompagner là où vous en avez besoin.")}</p>
            </div>
            <div className="servicesGrid">
              {activities.map((svc: any) => (
                <div key={svc.id} className="serviceCard reveal">
                  <span className="serviceNum">{svc.num}</span>
                  <div className="serviceIcon">{getIcon(svc.icon_name)}</div>
                  <h3 className="serviceTitle">{nlField(svc, "title")}</h3>
                  <p className="serviceDesc">{nlField(svc, "description")}</p>
                  <div className="serviceTags">
                    {nlField(svc, "tags")
                      .split("|")
                      .filter(Boolean)
                      .map((tag: string) => (
                        <span key={tag} className="serviceTag">
                          {tag.trim()}
                        </span>
                      ))}
                  </div>
                  <a
                    href="#contact"
                    className="serviceLink"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo("contact");
                    }}
                  >
                    {c("services.link", "Prendre contact")}
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DISTANCIEL */}
        <section className="distanciel">
          <div className="reveal">
            <h2 className="distancielTitle">
              {c("distanciel.title_1", "Séances")} <em>{c("distanciel.title_em", "100% à distance")}</em>
              {c("distanciel.title_2", ", où que vous soyez")}
            </h2>
          </div>
          <div className="reveal">
            <p className="distancielText">{c("distanciel.text", "Je vous reçois uniquement en distanciel pour vous offrir la flexibilité dont vous avez besoin. Choisissez la plateforme qui vous convient.")}</p>
            <div className="platforms">
              <span className="platform">📹 Google Meet</span>
              <span className="platform">💬 WhatsApp</span>
              <span className="platform">🎥 Zoom</span>
            </div>
          </div>
        </section>

        {/* APPROCHE */}
        <section className="process" id="approche">
          <div className="reveal">
            <p className="eyebrow">{c("approach.eyebrow", "Ma Démarche")}</p>
            <h2 className="sectionTitle">
              {c("approach.title", "Un chemin en quatre")} <em>{c("approach.title_em", "étapes fondatrices")}</em>
            </h2>
            <div className="processSteps">
              {approachSteps.map((step) => (
                <div key={step.num} className="processStep">
                  <span className="stepNum">{step.num}</span>
                  <div>
                    <h3 className="stepTitle">{c(step.titleKey, step.titleDefault)}</h3>
                    <p className="stepDesc">{c(step.descKey, step.descDefault)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="processVisual reveal">
            <div className="mandala">
              <div className="mandalaCenter">∞</div>
            </div>
          </div>
        </section>

        {/* FORMATIONS */}
        {formations && formations.length > 0 && (
          <section
            style={{ padding: "5rem 6rem", background: "var(--warm-white)" }}
            id="formations"
          >
            <div
              className="reveal"
              style={{
                textAlign: "center",
                maxWidth: 600,
                margin: "0 auto 3rem",
              }}
            >
              <p className="eyebrow eyebrowCenter">{c("formations.eyebrow", "Parcours")}</p>
              <h2 className="sectionTitle">
                {c("formations.title", "Formations &")} <em>{c("formations.title_em", "Habilitations")}</em>
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1.25rem",
                maxWidth: 1100,
                margin: "0 auto",
              }}
            >
              {formations.map((f) => {
                const titleDisplay =
                  lang === "nl" && f.title_nl ? f.title_nl : f.title;
                const descDisplay =
                  lang === "nl" && f.description_nl
                    ? f.description_nl
                    : f.description;
                return (
                  <div
                    key={f.id}
                    className="reveal"
                    style={{
                      background: "var(--sage-pale)",
                      borderRadius: 6,
                      padding: "2rem",
                      border: "1px solid rgba(139,158,126,0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        {f.badge && (
                          <span style={{ fontSize: "1.4rem" }}>{f.badge}</span>
                        )}
                        <div>
                          <div
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 500,
                              color: "var(--charcoal)",
                            }}
                          >
                            {titleDisplay}
                          </div>
                          {f.organisation && (
                            <div
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--mist)",
                                marginTop: "0.15rem",
                              }}
                            >
                              {f.organisation}
                            </div>
                          )}
                        </div>
                      </div>
                      {f.year && (
                        <span
                          style={{
                            background: "var(--warm-white)",
                            color: "var(--sage)",
                            fontSize: "0.72rem",
                            fontWeight: 500,
                            padding: "0.2rem 0.6rem",
                            borderRadius: 20,
                            flexShrink: 0,
                          }}
                        >
                          {f.year}
                        </span>
                      )}
                    </div>
                    {descDisplay && (
                      <p
                        style={{
                          fontSize: "0.83rem",
                          color: "var(--mist)",
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        {descDisplay}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {/* TARIFS */}
        {offers && offers.length > 0 && (
          <section id="tarifs" style={{ padding: '5rem 6rem', background: 'var(--sage-pale)' }}>
            <div className="reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 3rem' }}>
              <p className="eyebrow eyebrowCenter">{c("pricing.eyebrow", "Tarifs")}</p>
              <h2 className="sectionTitle">
                {c("pricing.title", "Des tarifs")} <em>{c("pricing.title_em", "adaptés")}</em>{c("pricing.title_2", " à votre situation")}
              </h2>
              <p className="text">{c("pricing.subtitle", "Adapté à votre situation personnelle et professionnelle.")}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
              {offers.map((o) => (
                <div key={o.id} className="reveal" style={{
                  background: 'var(--warm-white)',
                  border: o.featured ? '1px solid rgba(139,158,126,0.5)' : '1px solid rgba(139,158,126,0.15)',
                  borderRadius: 8,
                  padding: '2.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--clay)' }}>
                    {nlField(o, 'label')}
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.9rem', fontWeight: 300, color: 'var(--charcoal)' }}>
                    {nlField(o, 'price') || o.price}
                  </div>
                  {(o.detail || o.detail_nl) && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--mist)', lineHeight: 1.7, margin: 0 }}>
                      {nlField(o, 'detail')}
                    </p>
                  )}
                  {(o.note || o.note_nl) && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--mist)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                      {nlField(o, 'note')}
                    </p>
                  )}
                  <a
                    href="#contact"
                    style={{ marginTop: 'auto', display: 'inline-block', background: 'var(--sage)', color: 'var(--warm-white)', padding: '0.65rem 1.4rem', borderRadius: 3, fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', alignSelf: 'flex-start' }}
                    onClick={(e) => { e.preventDefault(); scrollTo('contact'); }}
                  >
                    {nlField(o, 'btn_text') || c('nav.cta', 'Prendre Rendez-vous')}
                  </a>
                </div>
              ))}
            </div>
            {c("cancellation_policy", CONTENT_DEFAULTS.cancellation_policy) && (
              <div className="reveal" style={{ maxWidth: 700, margin: '3rem auto 0', padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.6)', borderRadius: 6, border: '1px solid rgba(139,158,126,0.1)' }}>
                <p style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: '0.5rem' }}>
                  {c("pricing.cancellation_title", "⚠ Politique d'annulation")}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--mist)', lineHeight: 1.7, margin: 0 }}>
                  {c("cancellation_policy", CONTENT_DEFAULTS.cancellation_policy)}
                </p>
              </div>
            )}
          </section>
        )}

        {/* CONTACT */}
        <section className="contact" id="contact">
          <div className="reveal">
            <p className="eyebrow">{c("contact.eyebrow", "Contact")}</p>
            <h2 className="contactTitle">
              {c("contact.title", "Votre chemin commence")} <em>{c("contact.title_em", "ici")}</em>
            </h2>
            <p className="text">{c("contact.subtitle", "Remplissez le formulaire ou contactez-moi directement.")}</p>
            <div className="contactDetails">
              <div className="contactDetail">
                <div className="detailIcon">
                  <PhoneIcon />
                </div>
                <a href={phoneHref}>{phone}</a>
              </div>
              <div className="contactDetail">
                <div className="detailIcon">
                  <MailIcon />
                </div>
                <a href={`mailto:${email}`}>{email}</a>
              </div>
              <div className="contactDetail">
                <div className="detailIcon">
                  <VideoIcon />
                </div>
                <span>{c("contact.platforms", "Meet · WhatsApp · Zoom")}</span>
              </div>
            </div>
          </div>

          <form className="contactForm reveal" onSubmit={handleSubmit}>
            {sent ? (
              <div className="successMsg">
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🌿</div>
                <h3
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: "1.5rem",
                    fontWeight: 300,
                    marginBottom: "0.75rem",
                  }}
                >
                  {c("contact.success_title", "Message envoyé !")}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--mist)" }}>
                  {c("contact.success_text", "Nancy vous recontactera dans les meilleurs délais.")}
                </p>
              </div>
            ) : siteContent.form_active === "false" ? (
              <div className="successMsg">
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📅</div>
                <h3
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: "1.5rem",
                    fontWeight: 300,
                    marginBottom: "0.75rem",
                  }}
                >
                  {c("contact.disabled_title", "Formulaire temporairement indisponible")}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--mist)" }}>
                  {c("contact.disabled_text", "Contactez-moi directement par email ou téléphone.")}
                </p>
              </div>
            ) : (
              <>
                <div className="formRow">
                  <div className="formGroup">
                    <label>{c("contact.form_firstname", "Prénom")}</label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, prenom: e.target.value }))
                      }
                      placeholder={c("contact.ph_firstname", "Votre prénom")}
                      required
                    />
                  </div>
                  <div className="formGroup">
                    <label>{c("contact.form_lastname", "Nom")}</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, nom: e.target.value }))
                      }
                      placeholder={c("contact.ph_lastname", "Votre nom")}
                      required
                    />
                  </div>
                </div>
                <div className="formGroup">
                  <label>{c("contact.form_email", "Email")}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder={c("contact.ph_email", "votre@email.com")}
                    required
                  />
                </div>
                <div className="formGroup">
                  <label>{c("contact.form_phone", "Téléphone")}</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, telephone: e.target.value }))
                    }
                    placeholder={c("contact.ph_phone", "0495 XX XX XX")}
                  />
                </div>
                <div className="formGroup">
                  <label>{c("contact.form_message", "Message")}</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, message: e.target.value }))
                    }
                    placeholder={c("contact.ph_message", "Partagez brièvement ce qui vous amène…")}
                    rows={4}
                  />
                </div>
                {formError && (
                  <p
                    style={{
                      color: "var(--danger)",
                      fontSize: "0.82rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {formError}
                  </p>
                )}
                <button type="submit" className="btnSubmit" disabled={sending}>
                  {sending
                    ? c("contact.form_sending", "Envoi en cours…")
                    : c("contact.form_submit", "Envoyer ma demande")}
                </button>
              </>
            )}
          </form>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footerMain">
          <div>
            <div className="footerLogo">
              Nancy M <span>Therapy</span>
            </div>
            <p className="footerTagline">{c("footer.tagline", "Nancy M. — Coaching, hypnothérapie, thérapie de couple et guidance intuitive-cognitive en distanciel.")}</p>
            <p className="footerTva">{c("footer.tva", "TVA / BTW : BE0749.913.631")}</p>
          </div>
          {activities && activities.length > 0 && (
            <div className="footerCol">
              <h3>{c("footer.col_activities", "Activités")}</h3>
              <ul>
                {activities.map((a) => (
                  <li key={a.id}>
                    <a href="#services" onClick={(e) => { e.preventDefault(); scrollTo("services"); }}>
                      {nlField(a, 'title')}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="footerCol">
            <h3>{c("footer.col_navigation", "Navigation")}</h3>
            <ul>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo("about"); }}>{c("footer.link_about", "À propos")}</a></li>
              <li><a href="#approche" onClick={(e) => { e.preventDefault(); scrollTo("approche"); }}>{c("footer.link_approach", "Démarche")}</a></li>
              {offers && offers.length > 0 && (
                <li><a href="#tarifs" onClick={(e) => { e.preventDefault(); scrollTo("tarifs"); }}>{c("footer.link_pricing", "Tarifs")}</a></li>
              )}
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo("contact"); }}>{c("footer.link_contact", "Contact")}</a></li>
            </ul>
          </div>
          <div className="footerCol">
            <h3>{c("footer.col_contact", "Contact")}</h3>
            <ul>
              <li>
                <a href={phoneHref}>{phone}</a>
              </li>
              <li>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footerBottom">
          <span>{c("footer.copyright", "© 2025 Nancy M Therapy")}</span>
          <span>{c("footer.made", "Fait avec soin 🌿")}</span>
        </div>
      </footer>
    </div>
  );
}

// Lang switcher styles
const langSwitch: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.3rem",
};
const langBtn: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "Jost, sans-serif",
  fontSize: "0.72rem",
  letterSpacing: "0.12em",
  color: "var(--mist)",
  padding: "0.2rem 0.3rem",
  transition: "color 0.2s",
};
const langBtnActive: CSSProperties = {
  color: "var(--charcoal)",
  fontWeight: 500,
};

function getIcon(name: string) {
  switch (name) {
    case "life":
      return <LifeIcon />;
    case "heart":
      return <HeartIcon />;
    case "hypno":
      return <HypnoIcon />;
    case "couple":
      return <CoupleIcon />;
    case "eye":
      return <EyeIcon />;
    default:
      return <StarIcon />;
  }
}

// Icons
function LifeIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="24" cy="24" r="20" />
      <path d="M24 12 C24 12 16 18 16 26 C16 30.4 19.6 34 24 34 C28.4 34 32 30.4 32 26 C32 18 24 12 24 12Z" />
      <line x1="24" y1="34" x2="24" y2="38" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M24 40 C14 34 8 26 8 20 C8 14.5 12.5 10 18 10 C21 10 23.8 11.4 24 14 C24.2 11.4 27 10 30 10 C35.5 10 40 14.5 40 20 C40 26 34 34 24 40Z" />
    </svg>
  );
}
function HypnoIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="24" cy="18" r="10" />
      <path d="M14 28 C10 32 8 38 8 42 L40 42 C40 38 38 32 34 28" />
      <line x1="24" y1="8" x2="24" y2="5" />
    </svg>
  );
}
function CoupleIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="18" cy="20" r="10" />
      <circle cx="30" cy="28" r="10" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8 24 C8 24 16 12 24 12 C32 12 40 24 40 24 C40 24 32 36 24 36 C16 36 8 24 8 24Z" />
      <circle cx="24" cy="24" r="6" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polygon points="24,6 28,17 40,17 30,24 34,35 24,28 14,35 18,24 8,17 20,17" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-1.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 15z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}
function BotanicalSVG() {
  return (
    <svg
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        opacity: 0.3,
      }}
      viewBox="0 0 500 600"
      fill="none"
    >
      <path
        d="M250 550 C250 550 180 450 160 350 C140 250 200 150 250 100"
        stroke="rgba(139,158,126,0.6)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M250 100 C280 80 320 120 300 160 C280 200 240 180 250 140"
        stroke="rgba(139,158,126,0.5)"
        strokeWidth="1"
        fill="rgba(184,201,173,0.2)"
      />
      <path
        d="M250 200 C210 170 170 200 190 240 C210 280 250 260 250 230"
        stroke="rgba(139,158,126,0.5)"
        strokeWidth="1"
        fill="rgba(184,201,173,0.2)"
      />
      <path
        d="M250 300 C290 270 330 300 310 340 C290 380 250 360 250 330"
        stroke="rgba(196,137,106,0.4)"
        strokeWidth="1"
        fill="rgba(232,187,163,0.2)"
      />
      <circle
        cx="250"
        cy="90"
        r="12"
        stroke="rgba(196,137,106,0.5)"
        strokeWidth="1"
        fill="rgba(232,187,163,0.3)"
      />
    </svg>
  );
}
