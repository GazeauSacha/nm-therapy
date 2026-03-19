import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
    } else {
      navigate('/admin/dashboard')
    }
  }

  return (
    <div style={styles.overlay}>
      <form onSubmit={handleLogin} style={styles.box}>
        <div style={styles.logo}>NM <span style={{ color: 'var(--sage)', fontStyle: 'italic' }}>Therapy</span></div>
        <div style={styles.sub}>Espace Administration</div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nancy@nmtherapy.be"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={styles.input}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? 'Connexion…' : 'Accéder au tableau de bord'}
        </button>

        <p style={styles.hint}>
          Accès réservé à Nancy Massaoudi.<br />
          Mot de passe oublié ? Contactez votre développeur.
        </p>
      </form>
    </div>
  )
}

const styles = {
  overlay: { minHeight: '100vh', background: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  box: { background: 'var(--warm-white)', borderRadius: 8, padding: '3rem 2.5rem', width: 380, textAlign: 'center', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', animation: 'scaleIn 0.4s ease' },
  logo: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 400, color: 'var(--charcoal)', marginBottom: '0.3rem' },
  sub: { fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '2rem' },
  field: { marginBottom: '1rem', textAlign: 'left' },
  label: { display: 'block', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '0.4rem' },
  input: { width: '100%', border: '1px solid rgba(139,158,126,0.3)', borderRadius: 3, padding: '0.8rem 1rem', fontFamily: 'Jost, sans-serif', fontSize: '0.9rem', color: 'var(--charcoal)', background: 'var(--warm-white)', outline: 'none' },
  btn: { width: '100%', background: 'var(--sage)', color: 'var(--warm-white)', border: 'none', padding: '0.9rem', fontFamily: 'Jost, sans-serif', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer', marginTop: '0.5rem' },
  error: { color: 'var(--danger)', fontSize: '0.8rem', margin: '0.5rem 0', textAlign: 'left' },
  hint: { fontSize: '0.68rem', color: 'var(--mist)', marginTop: '1.5rem', lineHeight: 1.7 },
}
