import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation, Trans } from "react-i18next";
import { supabase } from "../lib/supabase";

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

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [siteContent, setSiteContent] = useState<SiteContent>(CONTENT_DEFAULTS);
  const [formations, setFormations] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
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

  const c = (key: keyof SiteContent): string => {
    if (lang === "nl") {
      const nlKey = `${key}_nl` as keyof SiteContent;
      const nlVal = siteContent[nlKey];
      if (nlVal && nlVal.trim()) return nlVal;
    }
    return siteContent[key] || CONTENT_DEFAULTS[key] || "";
  };

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

  const tickerArr = siteContent.ticker_items
    ? siteContent.ticker_items
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
    : TICKER_DEFAULTS;
  const tickerDuration = TICKER_SPEED[siteContent.ticker_speed] || "30s";

  const phone = siteContent.contact_phone || CONTENT_DEFAULTS.contact_phone;
  const email = siteContent.contact_email || CONTENT_DEFAULTS.contact_email;
  const phoneHref = "tel:+32" + phone.replace(/\s/g, "").replace(/^0/, "");

  const approachSteps: [string, string, string][] = [
    ["01", "approach.01_title", "approach.01_desc"],
    ["02", "approach.02_title", "approach.02_desc"],
    ["03", "approach.03_title", "approach.03_desc"],
    ["04", "approach.04_title", "approach.04_desc"],
  ];

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
            {(
              ["about", "services", "approche", "contact"] as const
            ).map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(id);
                  }}
                >
                  {t(
                    `nav.${id === "approche" ? "approach" : id}`,
                  )}
                </a>
              </li>
            ))}
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
              {t("nav.cta")}
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
            ["about", t("nav.about")],
            ["services", t("nav.services")],
            ["approche", t("nav.approach")],
            ["tarifs", t("nav.pricing")],
            ["contact", t("nav.contact")],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="mobileMenuLink"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setTimeout(() => scrollTo(id), 100);
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
            {t("nav.cta")}
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main>
        {/* HERO */}
        <section className="hero">
          <div className="heroBefore" />
          <div className="heroLeft">
            <p className="heroEyebrow">{t("hero.eyebrow")}</p>
            <h1 className="heroTitle">
              <em>{c("hero_subtitle")}</em>
            </h1>
            <p className="heroQuote">« {c("hero_quote")} »</p>
            <p className="heroSub">{c("hero_tagline")}</p>
            <div className="heroActions">
              <a
                href="#contact"
                className="btnPrimary"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("contact");
                }}
              >
                {t("hero.btn_contact")}
              </a>
              <a
                href="#services"
                className="btnGhost"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("services");
                }}
              >
                {t("hero.btn_services")}
              </a>
            </div>
          </div>
          <div className="heroRight">
            <div className="heroImageWrap">
              <BotanicalSVG />
            </div>
            {/* <div className="heroQuoteCard">
              <blockquote>{t("hero.quote_card")}</blockquote>
              <cite>{c("hero_title")}</cite>
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
                {t("about.badge")}
              </div>
            </div>
          </div>
          <div className="aboutContent reveal">
            <p className="eyebrow">{t("about.eyebrow")}</p>
            <h2 className="sectionTitle">
              {t("about.title")} <em>{t("about.title_em")}</em>
            </h2>
            <p className="text">{c("about_text_1")}</p>
            <p className="text">{c("about_text_2")}</p>
            <p className="text">
              <Trans
                i18nKey="about.paragraph3"
                components={{ strong: <strong /> }}
              />
            </p>
            <div className="signature">{c("hero_title")}</div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="services" id="services">
          <div className="servicesHeader reveal">
            <p className="eyebrow eyebrowCenter">{t("services.eyebrow")}</p>
            <h2 className="sectionTitle">
              {t("services.title")} <em>{t("services.title_em")}</em>
            </h2>
            <p className="text">{t("services.subtitle")}</p>
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
                  {t("services.link")}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* DISTANCIEL */}
        <section className="distanciel">
          <div className="reveal">
            <h2 className="distancielTitle">
              {t("distanciel.title_1")} <em>{t("distanciel.title_em")}</em>
              {t("distanciel.title_2")}
            </h2>
          </div>
          <div className="reveal">
            <p className="distancielText">{t("distanciel.text")}</p>
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
            <p className="eyebrow">{t("approach.eyebrow")}</p>
            <h2 className="sectionTitle">
              {t("approach.title")} <em>{t("approach.title_em")}</em>
            </h2>
            <div className="processSteps">
              {approachSteps.map(([num, titleKey, descKey]) => (
                <div key={num} className="processStep">
                  <span className="stepNum">{num}</span>
                  <div>
                    <h3 className="stepTitle">{t(titleKey)}</h3>
                    <p className="stepDesc">{t(descKey)}</p>
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
        {formations.length > 0 && (
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
              <p className="eyebrow eyebrowCenter">{t("formations.eyebrow")}</p>
              <h2 className="sectionTitle">
                {t("formations.title")} <em>{t("formations.title_em")}</em>
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
        {/* CONTACT */}
        <section className="contact" id="contact">
          <div className="reveal">
            <p className="eyebrow">{t("contact.eyebrow")}</p>
            <h2 className="contactTitle">
              {t("contact.title")} <em>{t("contact.title_em")}</em>
            </h2>
            <p className="text">{t("contact.subtitle")}</p>
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
                <span>{t("contact.platforms")}</span>
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
                  {t("contact.success_title")}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--mist)" }}>
                  {t("contact.success_text")}
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
                  {t("contact.disabled_title")}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--mist)" }}>
                  {t("contact.disabled_text")}
                </p>
              </div>
            ) : (
              <>
                <div className="formRow">
                  <div className="formGroup">
                    <label>{t("contact.form_firstname")}</label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, prenom: e.target.value }))
                      }
                      placeholder={t("contact.ph_firstname")}
                      required
                    />
                  </div>
                  <div className="formGroup">
                    <label>{t("contact.form_lastname")}</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, nom: e.target.value }))
                      }
                      placeholder={t("contact.ph_lastname")}
                      required
                    />
                  </div>
                </div>
                <div className="formGroup">
                  <label>{t("contact.form_email")}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder={t("contact.ph_email")}
                    required
                  />
                </div>
                <div className="formGroup">
                  <label>{t("contact.form_phone")}</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, telephone: e.target.value }))
                    }
                    placeholder={t("contact.ph_phone")}
                  />
                </div>
                <div className="formGroup">
                  <label>{t("contact.form_message")}</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, message: e.target.value }))
                    }
                    placeholder={t("contact.ph_message")}
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
                    ? t("contact.form_sending")
                    : t("contact.form_submit")}
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
            <p className="footerTagline">{t("footer.tagline")}</p>
            <p className="footerTva">{t("footer.tva")}</p>
          </div>
          <div className="footerCol">
            <h3>{t("footer.col_activities")}</h3>
            <ul>
              {[
                "Life Coaching",
                "Love Coaching",
                "Hypnose",
                "Thérapie couple",
                "Sexothérapie",
                "EMDR",
              ].map((l) => (
                <li key={l}>
                  <a
                    href="#services"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo("services");
                    }}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footerCol">
            <h3>{t("footer.col_navigation")}</h3>
            <ul>
              {[
                ["about", t("footer.link_about")],
                ["approche", t("footer.link_approach")],
                ["contact", t("footer.link_contact")],
              ].map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(id);
                    }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footerCol">
            <h3>{t("footer.col_contact")}</h3>
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
          <span>{t("footer.copyright")}</span>
          <span>{t("footer.made")}</span>
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
