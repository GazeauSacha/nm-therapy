import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'

interface TopbarProps {
  title: string
  subtitle?: string
  back?: { label: string; to: string }
}

export default function Topbar({ title, subtitle, back }: TopbarProps) {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div style={styles.topbar} className="admin-topbar">
      <div>
        {back && <Link to={back.to} style={styles.back}>{back.label}</Link>}
        <div style={styles.title}>{title}</div>
        {subtitle && <div style={styles.sub}>{subtitle}</div>}
      </div>
      <div style={styles.right}>
        <div style={styles.date}>{today}</div>
        <Link to="/" target="_blank" style={styles.siteBtn}>↗ Voir le site</Link>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  topbar: { background: 'var(--warm-white)', borderBottom: '1px solid rgba(139,158,126,0.15)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 },
  back: { display: 'inline-block', fontSize: '0.72rem', color: 'var(--sage)', textDecoration: 'none', marginBottom: '0.2rem', letterSpacing: '0.04em' },
  title: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--charcoal)' },
  sub: { fontSize: '0.75rem', color: 'var(--mist)', marginTop: '0.1rem' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  date: { fontSize: '0.78rem', color: 'var(--mist)' },
  siteBtn: { fontSize: '0.72rem', letterSpacing: '0.08em', padding: '0.35rem 0.8rem', borderRadius: 3, cursor: 'pointer', border: '1px solid var(--sage)', color: 'var(--sage)', background: 'transparent', textDecoration: 'none', transition: 'all 0.2s' },
}
