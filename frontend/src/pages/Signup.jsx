import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DrawingHero from '../components/DrawingHero'
import { colors, fonts } from '../styles'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup(name, email, password)
      navigate('/dashboard')
    } catch (err) {
      if (err.response) setError(err.response.data?.detail || 'Signup failed, please try again')
      else if (err.request) setError('Could not reach the backend, is it running on port 8000?')
      else setError(`Unexpected error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={{ ...styles.blob, top: '-10%', right: '4%', width: 420, height: 420, background: 'radial-gradient(circle, rgba(255,107,157,0.28), transparent 70%)' }} className="float-blob" />
      <div style={{ ...styles.blob, bottom: '-14%', left: '6%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(108,92,231,0.28), transparent 70%)' }} className="float-blob-slow" />

      <div style={styles.split}>
        <div className="fade-in" style={{ flex: 1, maxWidth: 380 }}>
          <div style={styles.heroArt}><DrawingHero /></div>
          <div style={styles.heroTitle}>Every idea, <span className="gradient-text">saved</span></div>
          <div style={styles.heroSubtitle}>Create a board, share the link, everyone draws at once.</div>
        </div>

        <div style={styles.card} className="fade-in">
          <div style={styles.logoBadge}>W</div>
          <div style={styles.title}>Create your account</div>
          <div style={styles.subtitle}>Start creating and joining boards</div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Name</label>
            <input className="input-glow" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            <label style={styles.label}>Email</label>
            <input className="input-glow" style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            <label style={styles.label}>Password</label>
            <input className="input-glow" style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
            <button className="btn-gradient tap" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div style={styles.switchText}>
            Already have an account? <Link to="/login" style={styles.switchLink}>Log in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: '50%', filter: 'blur(10px)', zIndex: 0 },
  split: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60, zIndex: 1, maxWidth: 980, width: '100%', padding: '0 40px', flexWrap: 'wrap' },
  heroArt: { width: '100%', maxWidth: 340, marginBottom: 20 },
  heroTitle: { fontSize: 32, fontWeight: 700, fontFamily: fonts.display, lineHeight: 1.2, marginBottom: 10 },
  heroSubtitle: { fontSize: 14, color: colors.subtext, maxWidth: 320 },
  card: {
    width: 400, background: colors.panel, backdropFilter: 'blur(20px)', borderRadius: 22,
    border: `1px solid ${colors.border}`, padding: '42px 36px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
    flexShrink: 0,
  },
  logoBadge: {
    width: 52, height: 52, borderRadius: 15, background: colors.gradientBrand, color: '#100a26',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800,
    fontFamily: fonts.display, margin: '0 auto 20px',
  },
  title: { textAlign: 'center', fontSize: 24, fontWeight: 700, fontFamily: fonts.display, marginBottom: 6 },
  subtitle: { textAlign: 'center', fontSize: 13, color: colors.subtext, marginBottom: 28 },
  label: { fontSize: 11, fontWeight: 700, color: colors.subtext, marginBottom: 7, display: 'block', letterSpacing: 0.4, textTransform: 'uppercase' },
  input: { width: '100%', padding: '12px 15px', borderRadius: 12, border: `1px solid ${colors.border}`, fontSize: 14, marginBottom: 16, outline: 'none', background: 'rgba(255,255,255,0.04)', color: colors.text },
  button: { width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 6 },
  error: { background: 'rgba(255,107,107,0.1)', color: '#ff8f8f', border: '1px solid rgba(255,107,107,0.25)', fontSize: 12.5, padding: '10px 14px', borderRadius: 10, marginBottom: 16 },
  switchText: { textAlign: 'center', fontSize: 13, color: colors.subtext, marginTop: 22 },
  switchLink: { color: colors.lime, fontWeight: 700 },
}
