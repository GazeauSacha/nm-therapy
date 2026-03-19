import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Topbar from '../../components/Topbar'
import { useAuth } from '../../hooks/useAuth'

export default function Settings() {
  const { user } = useAuth()
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')
  const [saving, setSaving] = useState(false)

  async function changePassword(e) {
    e.preventDefault()
    setPwMsg(''); setPwError('')
    if (pwForm.next !== pwForm.confirm) { setPwError('Les mots de passe ne correspondent pas.'); return }
    if (pwForm.next.length < 8) { setPwError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    setSaving(false)
    if (error) setPwError(error.message)
    else { setPwMsg('✓ Mot de passe modifié avec succès.'); setPwForm({ current: '', next: '', confirm: '' }) }
  }

  return (
    <div>
      <Topbar title="Paramètres" subtitle="Gérez votre compte et vos préférences." />
      <div style={{ padding: '2rem' }}>
        <div style={s.grid}>

          {/* Profil */}
          <div style={s.card}>
            <div style={s.cardTitle}>Mon profil</div>
            <div style={s.profileRow}>
              <div style={s.avatar}>N</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--charcoal)' }}>Nancy Massaoudi</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--mist)', marginTop: '0.2rem' }}>{user?.email}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--sage)', marginTop: '0.25rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Administratrice</div>
              </div>
            </div>
            <div style={s.infoGrid}>
              <InfoRow label="Téléphone" value="0495 65 01 30" />
              <InfoRow label="Email pro" value="nancymtherapy@gmail.com" />
              <InfoRow label="TVA / BTW" value="BE0749.913.631" />
              <InfoRow label="Modalité" value="Distanciel (Meet · WhatsApp · Zoom)" />
            </div>
            <p style={s.hint}>Pour modifier vos informations personnelles, mettez à jour la section "Contenu du site".</p>
          </div>

          {/* Changer mot de passe */}
          <div style={s.card}>
            <div style={s.cardTitle}>Sécurité</div>
            <form onSubmit={changePassword}>
              <Fg label="Nouveau mot de passe" type="password" value={pwForm.next} onChange={v => setPwForm(p => ({ ...p, next: v }))} placeholder="Au moins 8 caractères" />
              <Fg label="Confirmer le mot de passe" type="password" value={pwForm.confirm} onChange={v => setPwForm(p => ({ ...p, confirm: v }))} placeholder="Répétez le mot de passe" />
              {pwError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{pwError}</p>}
              {pwMsg && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{pwMsg}</p>}
              <button type="submit" style={btn} disabled={saving}>{saving ? 'Modification…' : 'Changer le mot de passe'}</button>
            </form>
          </div>

          {/* Disponibilités */}
          <div style={s.card}>
            <div style={s.cardTitle}>Jours de travail habituels</div>
            <p style={s.hint}>Indicatif — sert de référence pour les rendez-vous.</p>
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi (matin)'].map((day, i) => (
              <Toggle key={day} label={day} defaultOn={i < 5} />
            ))}
          </div>

          {/* Infos Supabase */}
          <div style={s.card}>
            <div style={s.cardTitle}>Informations système</div>
            <InfoRow label="User ID" value={user?.id?.slice(0, 18) + '…'} />
            <InfoRow label="Dernière connexion" value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : '—'} />
            <InfoRow label="Méthode d'auth" value="Email / Mot de passe" />
            <InfoRow label="Base de données" value="Supabase (PostgreSQL)" />
            <InfoRow label="Hébergement" value="Vercel" />
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--sage-pale)', borderRadius: 4, fontSize: '0.78rem', color: 'var(--sage)', lineHeight: 1.7 }}>
              💡 Pour réinitialiser votre mot de passe via email, utilisez la page de connexion et cliquez sur "Mot de passe oublié" — à configurer dans Supabase Auth &gt; Email Templates.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function Fg({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={s.label}>{label}</label>
      <input type={type} style={s.input} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required />
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(139,158,126,0.08)' }}>
      <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)' }}>{label}</span>
      <span style={{ fontSize: '0.83rem', color: 'var(--charcoal)' }}>{value}</span>
    </div>
  )
}

function Toggle({ label, defaultOn }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
      <div onClick={() => setOn(o => !o)} style={{ position: 'relative', width: 40, height: 22, background: on ? 'var(--sage)' : 'rgba(139,158,126,0.2)', borderRadius: 11, cursor: 'pointer', transition: 'background 0.3s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <span style={{ fontSize: '0.85rem', color: 'var(--charcoal)' }}>{label}</span>
    </div>
  )
}

const btn = { background: 'var(--sage)', color: 'var(--warm-white)', border: 'none', padding: '0.75rem 1.5rem', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer' }

const s = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  card: { background: 'var(--warm-white)', borderRadius: 6, padding: '2rem', border: '1px solid rgba(139,158,126,0.15)' },
  cardTitle: { fontSize: '0.85rem', fontWeight: 500, color: 'var(--charcoal)', marginBottom: '1.2rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(139,158,126,0.1)' },
  profileRow: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  avatar: { width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--warm-white)', flexShrink: 0 },
  infoGrid: { display: 'flex', flexDirection: 'column' },
  label: { display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  input: { width: '100%', border: '1px solid rgba(139,158,126,0.25)', borderRadius: 3, padding: '0.7rem 0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none' },
  hint: { fontSize: '0.75rem', color: 'var(--mist)', fontStyle: 'italic', marginBottom: '1rem', lineHeight: 1.6 },
}
