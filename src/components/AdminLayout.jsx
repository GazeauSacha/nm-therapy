import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/admin/dashboard', label: 'Tableau de bord', icon: <GridIcon /> },
  { to: '/admin/appointments', label: 'Rendez-vous', icon: <CalIcon />, badge: 'rdv' },
  { to: '/admin/clients', label: 'Clients', icon: <UsersIcon /> },
  { to: '/admin/messages', label: 'Messages', icon: <MsgIcon />, badge: 'msg' },
  { to: '/admin/finances', label: 'Facturation', icon: <EuroIcon /> },
  { to: '/admin/site', label: 'Contenu du site', icon: <GlobeIcon /> },
  { to: '/admin/settings', label: 'Paramètres', icon: <SettingsIcon /> },
]

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [unreadMsg, setUnreadMsg] = useState(0)
  const [pendingRdv, setPendingRdv] = useState(0)

  useEffect(() => {
    // Count unread messages
    supabase.from('contacts').select('id', { count: 'exact' }).eq('read', false)
      .then(({ count }) => setUnreadMsg(count || 0))

    // Count pending appointments
    supabase.from('appointments').select('id', { count: 'exact' }).eq('status', 'pending')
      .then(({ count }) => setPendingRdv(count || 0))

    // Realtime subscription for new messages
    const sub = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contacts' }, () => {
        setUnreadMsg(n => n + 1)
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [])

  const badges = { msg: unreadMsg, rdv: pendingRdv }

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F1EDE6' }}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.brand}>NM <span style={{ color: 'var(--sage-light)', fontStyle: 'italic' }}>Therapy</span></div>
          <div style={styles.adminTag}>Administration</div>
        </div>

        <nav style={styles.sidebarNav}>
          <div style={styles.navSectionLabel}>Principal</div>
          {navItems.slice(0, 4).map(item => (
            <NavItem key={item.to} item={item} badge={item.badge ? badges[item.badge] : 0} />
          ))}
          <div style={{ ...styles.navSectionLabel, marginTop: '1rem' }}>Finances</div>
          <NavItem item={navItems[4]} badge={0} />
          <div style={{ ...styles.navSectionLabel, marginTop: '1rem' }}>Paramètres</div>
          {navItems.slice(5).map(item => (
            <NavItem key={item.to} item={item} badge={0} />
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.sidebarUser}>
            <div style={styles.userAvatar}>N</div>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>Nancy Massaoudi</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>Administratrice</div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Déconnexion">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ animation: 'fadeInPage 0.3s ease' }}>
          <Outlet context={{ unreadMsg, pendingRdv }} />
        </div>
      </main>
    </div>
  )
}

function NavItem({ item, badge }) {
  return (
    <NavLink
      to={item.to}
      style={({ isActive }) => ({
        ...styles.navItem,
        ...(isActive ? styles.navItemActive : {}),
      })}
    >
      <span style={{ opacity: 0.8, display: 'flex' }}>{item.icon}</span>
      {item.label}
      {badge > 0 && <span style={styles.navBadge}>{badge}</span>}
    </NavLink>
  )
}

const styles = {
  sidebar: { width: 260, background: 'var(--charcoal)', minHeight: '100vh', position: 'fixed', top: 0, left: 0, display: 'flex', flexDirection: 'column', zIndex: 50 },
  sidebarLogo: { padding: '1.8rem 1.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  brand: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--warm-white)', fontWeight: 400 },
  adminTag: { fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem' },
  sidebarNav: { flex: 1, padding: '1.2rem 0', overflowY: 'auto' },
  navSectionLabel: { fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', padding: '0.8rem 1.5rem 0.4rem' },
  navItem: { display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1.5rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', borderLeft: '3px solid transparent', transition: 'all 0.2s', textDecoration: 'none' },
  navItemActive: { color: 'var(--warm-white)', borderLeftColor: 'var(--sage)', background: 'rgba(139,158,126,0.1)' },
  navBadge: { marginLeft: 'auto', background: 'var(--clay)', color: 'var(--warm-white)', fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: 10, fontWeight: 500 },
  sidebarBottom: { borderTop: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.5rem' },
  sidebarUser: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  userAvatar: { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', color: 'var(--warm-white)', flexShrink: 0 },
  logoutBtn: { marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '0.25rem' },
}

// Icons
function GridIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function CalIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function UsersIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function MsgIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function EuroIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> }
function GlobeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function LogoutIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
