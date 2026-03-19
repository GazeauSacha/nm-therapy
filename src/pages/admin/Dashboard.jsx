import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState({ clients: 0, rdvMonth: 0, unread: 0, pending: 0 })
  const [recentContacts, setRecentContacts] = useState([])
  const [upcomingRdv, setUpcomingRdv] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [
        { count: clients },
        { count: rdvMonth },
        { count: unread },
        { count: pending },
        { data: contacts },
        { data: rdvs },
      ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('date', startOfMonth),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('read', false),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('appointments').select('*, clients(first_name, last_name)').gte('date', now.toISOString()).order('date').limit(5),
      ])

      setStats({ clients: clients || 0, rdvMonth: rdvMonth || 0, unread: unread || 0, pending: pending || 0 })
      setRecentContacts(contacts || [])
      setUpcomingRdv(rdvs || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <Topbar title="Tableau de bord" subtitle="Bienvenue, Nancy. Voici votre résumé du jour." />
      <div style={s.content}>
        {/* Stats */}
        <div style={s.statsGrid}>
          <StatCard label="Clients actifs" value={stats.clients} change="↑ suivi en cours" color="var(--sage)" />
          <StatCard label="RDV ce mois" value={stats.rdvMonth} change={`${stats.pending} en attente`} color="var(--clay)" />
          <StatCard label="Messages non lus" value={stats.unread} change="→ Voir les messages" color="var(--gold)" />
          <StatCard label="RDV à confirmer" value={stats.pending} change="Action requise" color="var(--charcoal)" />
        </div>

        <div style={s.grid2}>
          {/* Prochains RDV */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>Prochains rendez-vous</span>
              <Link to="/admin/appointments" style={s.cardAction}>Voir tout →</Link>
            </div>
            {loading ? <Loader /> : upcomingRdv.length === 0 ? (
              <div style={s.empty}>Aucun rendez-vous à venir.</div>
            ) : upcomingRdv.map(rdv => (
              <div key={rdv.id} style={s.rdvRow}>
                <div style={s.av}>{rdv.clients?.first_name?.[0] || '?'}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.rdvName}>{rdv.clients?.first_name} {rdv.clients?.last_name}</div>
                  <div style={s.rdvSub}>{rdv.subject} · {rdv.platform || 'En ligne'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={s.rdvDate}>{new Date(rdv.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                  <div style={s.rdvTime}>{new Date(rdv.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <StatusBadge status={rdv.status} />
              </div>
            ))}
          </div>

          {/* Messages récents */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>Derniers messages</span>
              <Link to="/admin/messages" style={s.cardAction}>Voir tout →</Link>
            </div>
            {loading ? <Loader /> : recentContacts.length === 0 ? (
              <div style={s.empty}>Aucun message reçu.</div>
            ) : recentContacts.map(c => (
              <div key={c.id} style={{ ...s.msgRow, ...(c.read ? {} : s.msgUnread) }}>
                <div style={s.av}>{c.first_name?.[0] || '?'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.rdvName}>{c.first_name} {c.last_name}</div>
                  <div style={{ ...s.rdvSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject || c.message?.slice(0, 50)}</div>
                </div>
                <div style={s.rdvDate}>{new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, change, color }) {
  return (
    <div style={{ ...s.statCard, borderTopColor: color }}>
      <div style={s.statLabel}>{label}</div>
      <div style={s.statValue}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--mist)', marginTop: '0.4rem' }}>{change}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { confirmed: ['Confirmé', '#6BA88820', '#6BA888'], pending: ['En attente', '#C4896A20', '#C4896A'], cancelled: ['Annulé', '#E0707020', '#E07070'] }
  const [label, bg, color] = map[status] || ['Inconnu', '#eee', '#999']
  return <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.6rem', borderRadius: 20, background: bg, color, fontWeight: 500, marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>{label}</span>
}

function Loader() { return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--mist)', fontSize: '0.85rem' }}>Chargement…</div> }

const s = {
  content: { padding: '2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem', marginBottom: '1.5rem' },
  statCard: { background: 'var(--warm-white)', borderRadius: 6, padding: '1.5rem', border: '1px solid rgba(139,158,126,0.15)', borderTop: '3px solid', position: 'relative' },
  statLabel: { fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.75rem' },
  statValue: { fontFamily: 'Cormorant Garamond, serif', fontSize: '2.6rem', fontWeight: 300, color: 'var(--charcoal)', lineHeight: 1 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' },
  card: { background: 'var(--warm-white)', borderRadius: 6, border: '1px solid rgba(139,158,126,0.15)', overflow: 'hidden' },
  cardHeader: { padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(139,158,126,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: '0.85rem', fontWeight: 500, color: 'var(--charcoal)' },
  cardAction: { fontSize: '0.72rem', color: 'var(--sage)', textDecoration: 'none' },
  rdvRow: { display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1.5rem', borderBottom: '1px solid rgba(139,158,126,0.08)' },
  msgRow: { display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1.5rem', borderBottom: '1px solid rgba(139,158,126,0.08)' },
  msgUnread: { background: 'rgba(139,158,126,0.04)' },
  av: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', color: 'var(--warm-white)', flexShrink: 0 },
  rdvName: { fontSize: '0.85rem', fontWeight: 500, color: 'var(--charcoal)' },
  rdvSub: { fontSize: '0.72rem', color: 'var(--mist)' },
  rdvDate: { fontSize: '0.78rem', color: 'var(--charcoal)', fontWeight: 500 },
  rdvTime: { fontSize: '0.68rem', color: 'var(--mist)' },
  empty: { padding: '2rem 1.5rem', fontSize: '0.85rem', color: 'var(--mist)', fontStyle: 'italic' },
}
