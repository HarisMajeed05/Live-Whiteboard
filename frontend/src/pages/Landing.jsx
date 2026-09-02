import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DrawingHero from '../components/DrawingHero'
import { colors, fonts } from '../styles'

const FEATURES = [
  { title: 'Persistent boards', text: 'Every stroke is saved to the database the moment you draw it. Close the tab, come back next week, it is all still there.' },
  { title: 'Live cursors', text: 'See exactly where everyone else is working, in real time, with their name attached, not just a static list of who is online.' },
  { title: 'Full toolset', text: 'Pen, eraser, rectangle, circle, line, and text, with undo and redo that only ever affects your own actions, never anyone else\'s.' },
  { title: 'Zoom and pan', text: 'Scroll to zoom, hold space and drag to pan around an infinite feeling canvas instead of being boxed into one fixed view.' },
  { title: 'Soft-lock awareness', text: 'When someone starts editing a shape, everyone else sees a colored outline showing it is in use, before they collide with it.' },
  { title: 'Join by link', text: 'No invite system to configure, share a board ID, whoever has it can open and start drawing immediately.' },
]

export default function Landing() {
  const { user } = useAuth()

  return (
    <div style={styles.page}>
      <div className="float-blob" style={{ ...styles.blob, top: '-12%', left: '-8%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(108,92,231,0.4), transparent 70%)' }} />
      <div className="float-blob-slow" style={{ ...styles.blob, top: '20%', right: '-10%', width: 420, height: 420, background: 'radial-gradient(circle, rgba(198,241,53,0.3), transparent 70%)' }} />
      <div className="float-blob" style={{ ...styles.blob, bottom: '-15%', left: '30%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,107,157,0.25), transparent 70%)' }} />

      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <div style={styles.logoBadge}>W</div>
          <div style={styles.logoText}>Whiteboard</div>
        </div>
        <div style={styles.navActions}>
          {user ? (
            <Link to="/dashboard" className="btn-gradient tap" style={styles.navBtn}>Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" style={styles.navLink}>Log in</Link>
              <Link to="/signup" className="btn-gradient tap" style={styles.navBtn}>Sign up free</Link>
            </>
          )}
        </div>
      </nav>

      <section style={styles.hero}>
        <div className="fade-in" style={styles.heroText}>
          <div style={styles.eyebrow}>Realtime collaborative whiteboard</div>
          <h1 style={styles.headline}>
            Draw <span className="gradient-text">together</span>,<br />
            see it happen <span className="gradient-text">live</span>
          </h1>
          <p style={styles.subtext}>
            Multiple people, one board, zero delay. Every stroke syncs instantly and saves itself,
            so the whiteboard is exactly how you left it, every single time.
          </p>
          <div style={styles.ctaRow}>
            <Link to={user ? '/dashboard' : '/signup'} className="btn-gradient tap" style={styles.ctaPrimary}>
              {user ? 'Open your boards' : 'Start drawing free'}
            </Link>
          </div>

          <div style={styles.demoRow}>
            {['Priya', 'Alex', 'Sam'].map((name, i) => (
              <div key={name} style={styles.demoUser} className="fade-in">
                <div className="pulse-dot" style={{ ...styles.demoDot, background: [colors.coral, colors.indigo, colors.lime][i] }} />
                <span style={styles.demoName}>{name} is drawing right now</span>
              </div>
            ))}
          </div>
        </div>

        <div className="fade-in" style={styles.heroArt}>
          <DrawingHero />
        </div>
      </section>

      <section style={styles.featuresSection}>
        <div style={styles.sectionEyebrow}>What you get</div>
        <div style={styles.sectionTitle}>Built for actually working together</div>

        <div className="stagger" style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className="tilt-card" style={styles.featureCard}>
              <div style={styles.featureDot} />
              <div style={styles.featureTitle}>{f.title}</div>
              <div style={styles.featureText}>{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerText}>Open a board, share the link, start drawing.</div>
        <Link to={user ? '/dashboard' : '/signup'} className="btn-gradient tap" style={styles.ctaPrimary}>
          {user ? 'Open your boards' : 'Get started, it is free'}
        </Link>
      </footer>
    </div>
  )
}

const styles = {
  page: { position: 'relative', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden' },
  blob: { position: 'absolute', borderRadius: '50%', filter: 'blur(10px)', zIndex: 0, pointerEvents: 'none' },

  nav: { position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 48px' },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoBadge: { width: 34, height: 34, borderRadius: 10, background: colors.gradientBrand, color: '#100a26', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, fontFamily: fonts.display },
  logoText: { fontSize: 17, fontWeight: 700, fontFamily: fonts.display },
  navActions: { display: 'flex', alignItems: 'center', gap: 18 },
  navLink: { fontSize: 13.5, fontWeight: 600, color: colors.subtext },
  navBtn: { padding: '10px 20px', borderRadius: 11, color: '#100a26', fontSize: 13, fontWeight: 700, display: 'inline-block' },

  hero: { position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 50, padding: '50px 48px 90px', flexWrap: 'wrap', maxWidth: 1240, margin: '0 auto' },
  heroText: { flex: 1, minWidth: 340, maxWidth: 520 },
  eyebrow: { fontSize: 11.5, fontWeight: 700, color: colors.coral, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 16 },
  headline: { fontSize: 48, fontWeight: 700, fontFamily: fonts.display, lineHeight: 1.12, margin: '0 0 20px', letterSpacing: -1 },
  subtext: { fontSize: 15.5, color: colors.subtext, lineHeight: 1.65, marginBottom: 30, maxWidth: 460 },
  ctaRow: { marginBottom: 34 },
  ctaPrimary: { padding: '15px 30px', borderRadius: 13, color: '#100a26', fontSize: 15, fontWeight: 700, display: 'inline-block' },
  demoRow: { display: 'flex', flexDirection: 'column', gap: 12 },
  demoUser: { display: 'flex', alignItems: 'center', gap: 10 },
  demoDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  demoName: { fontSize: 12.5, color: colors.subtext, fontWeight: 500 },

  heroArt: { flex: 1, minWidth: 320, maxWidth: 460, aspectRatio: '4 / 3' },

  featuresSection: { position: 'relative', zIndex: 2, padding: '30px 48px 80px', maxWidth: 1160, margin: '0 auto' },
  sectionEyebrow: { fontSize: 11.5, fontWeight: 700, color: colors.lime, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 30, fontWeight: 700, fontFamily: fonts.display, textAlign: 'center', marginBottom: 44, letterSpacing: -0.5 },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
  featureCard: { background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 18, padding: '26px' },
  featureDot: { width: 10, height: 10, borderRadius: 3, background: colors.gradientBrand, marginBottom: 16 },
  featureTitle: { fontSize: 15.5, fontWeight: 700, fontFamily: fonts.display, marginBottom: 8 },
  featureText: { fontSize: 13, color: colors.subtext, lineHeight: 1.6 },

  footer: { position: 'relative', zIndex: 2, textAlign: 'center', padding: '60px 40px 80px' },
  footerText: { fontSize: 16, color: colors.subtext, marginBottom: 22 },
}
