import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { colors, fonts } from '../styles'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      if (err.response) setError(err.response.data?.detail || 'Login failed, please try again')
      else if (err.request) setError('Could not reach the backend, is it running on port 8000?')
      else setError(`Unexpected error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card} className="fade-in">
        <div style={styles.logoBadge}>W</div>
        <div style={styles.title}>Welcome back</div>
        <div style={styles.subtitle}>Log in to open your boards</div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input className="input-glow" style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <label style={styles.label}>Password</label>
          <input className="input-glow" style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          <button className="btn-gradient" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div style={styles.switchText}>
          New here? <Link to="/signup" style={styles.switchLink}>Create an account</Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: {
    width: 400, background: colors.panel, backdropFilter: 'blur(20px)', borderRadius: 20,
    border: `1px solid ${colors.border}`, padding: '42px 36px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
  },
  logoBadge: {
    width: 52, height: 52, borderRadius: 14, background: colors.gradientBrand, color: '#08090d',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800,
    fontFamily: fonts.display, margin: '0 auto 20px',
  },
  title: { textAlign: 'center', fontSize: 24, fontWeight: 700, fontFamily: fonts.display, marginBottom: 6 },
  subtitle: { textAlign: 'center', fontSize: 13, color: colors.subtext, marginBottom: 28 },
  label: { fontSize: 11, fontWeight: 700, color: colors.subtext, marginBottom: 7, display: 'block', letterSpacing: 0.4, textTransform: 'uppercase' },
  input: { width: '100%', padding: '12px 15px', borderRadius: 11, border: `1px solid ${colors.border}`, fontSize: 14, marginBottom: 16, outline: 'none', background: 'rgba(255,255,255,0.04)', color: colors.text },
  button: { width: '100%', padding: '13px 0', borderRadius: 11, border: 'none', color: '#08090d', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 6 },
  error: { background: 'rgba(255,107,107,0.1)', color: '#ff8f8f', border: '1px solid rgba(255,107,107,0.25)', fontSize: 12.5, padding: '10px 14px', borderRadius: 10, marginBottom: 16 },
  switchText: { textAlign: 'center', fontSize: 13, color: colors.subtext, marginTop: 22 },
  switchLink: { color: colors.cyan, fontWeight: 700 },
}
