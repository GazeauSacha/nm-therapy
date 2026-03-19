import { Link } from 'react-router-dom'

export default function Topbar({ title, subtitle }) {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div style={styles.topbar}>
      <div>
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

const styles = {
  topbar: { background: 'var(--warm-white)', borderBottom: '1px solid rgba(139,158,126,0.15)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 },
  title: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--charcoal)' },
  sub: { fontSize: '0.75rem', color: 'var(--mist)', marginTop: '0.1rem' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  date: { fontSize: '0.78rem', color: 'var(--mist)' },
  siteBtn: { fontSize: '0.72rem', letterSpacing: '0.08em', padding: '0.35rem 0.8rem', borderRadius: 3, cursor: 'pointer', border: '1px solid var(--sage)', color: 'var(--sage)', background: 'transparent', textDecoration: 'none', transition: 'all 0.2s' },
}
