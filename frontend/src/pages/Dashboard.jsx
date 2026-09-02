import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { colors, fonts } from '../styles'

export default function Dashboard() {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [creating, setCreating] = useState(false)
  const [joinError, setJoinError] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const loadBoards = async () => {
    setLoading(true)
    try {
      const res = await client.get('/boards')
      setBoards(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBoards()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await client.post('/boards', { name: newName.trim() })
      navigate(`/board/${res.data.id}`)
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setJoinError('')
    const id = joinId.trim()
    if (!id) return
    try {
      await client.get(`/boards/${id}`)
      navigate(`/board/${id}`)
    } catch (err) {
      setJoinError('No board found with that ID')
    }
  }

  const handleDelete = async (e, boardId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this board and everything drawn on it? This cannot be undone.')) return
    await client.delete(`/boards/${boardId}`)
    loadBoards()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logoRow}>
          <div style={styles.logoBadge}>W</div>
          <div style={styles.logoText}>Whiteboard</div>
        </div>
        <div style={styles.userRow}>
          <div style={styles.userName}>{user?.name}</div>
          <button className="tap" style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.panelsRow}>
          <form onSubmit={handleCreate} style={styles.panel}>
            <div style={styles.panelTitle}>New Board</div>
            <input
              className="input-glow"
              style={styles.input}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Board name, e.g. Sprint Planning"
            />
            <button className="btn-gradient tap" style={{ ...styles.submitBtn, opacity: creating ? 0.6 : 1 }} disabled={creating}>
              {creating ? 'Creating...' : '+ Create Board'}
            </button>
          </form>

          <form onSubmit={handleJoin} style={styles.panel}>
            <div style={styles.panelTitle}>Join a Board</div>
            <input
              className="input-glow"
              style={styles.input}
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Paste a board ID"
            />
            {joinError && <div style={styles.joinError}>{joinError}</div>}
            <button className="tap" style={styles.joinBtn}>Join Board</button>
          </form>
        </div>

        <div style={styles.sectionLabel}>My Boards</div>
        <div style={styles.grid}>
          {loading ? (
            <div style={styles.empty}>Loading...</div>
          ) : boards.length === 0 ? (
            <div style={styles.empty}>No boards yet, create one above to get started.</div>
          ) : (
            boards.map((b) => (
              <div key={b.id} className="tap glow-card" style={styles.card} onClick={() => navigate(`/board/${b.id}`)}>
                <div style={styles.cardIcon}>#</div>
                <div style={styles.cardName}>{b.name}</div>
                <div style={styles.cardMeta}>Created {new Date(b.created_at).toLocaleDateString()}</div>
                <div style={styles.cardId}>ID: {b.id}</div>
                <button style={styles.deleteBtn} onClick={(e) => handleDelete(e, b.id)}>Delete</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { height: '100vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 44px', borderBottom: `1px solid ${colors.border}` },
  logoRow: { display: 'flex', alignItems: 'center', gap: 11 },
  logoBadge: { width: 34, height: 34, borderRadius: 10, background: colors.gradientBrand, color: '#08090d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, fontFamily: fonts.display },
  logoText: { fontSize: 18, fontWeight: 700, fontFamily: fonts.display },
  userRow: { display: 'flex', alignItems: 'center', gap: 14 },
  userName: { fontSize: 13.5, fontWeight: 600, color: colors.subtext },
  logoutBtn: { padding: '8px 16px', borderRadius: 10, border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.04)', color: colors.text, fontSize: 12.5, cursor: 'pointer' },
  content: { padding: '36px 44px 60px', maxWidth: 1000, margin: '0 auto' },
  panelsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 40 },
  panel: { background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 18, padding: '22px' },
  panelTitle: { fontSize: 14.5, fontWeight: 700, marginBottom: 14, fontFamily: fonts.display },
  input: { width: '100%', padding: '11px 14px', borderRadius: 11, border: `1px solid ${colors.border}`, fontSize: 13.5, outline: 'none', background: 'rgba(255,255,255,0.04)', color: colors.text, marginBottom: 12 },
  submitBtn: { width: '100%', padding: '11px 0', borderRadius: 11, border: 'none', color: '#08090d', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  joinBtn: { width: '100%', padding: '11px 0', borderRadius: 11, border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.04)', color: colors.text, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  joinError: { fontSize: 12, color: colors.danger, marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: colors.subtext, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  card: { position: 'relative', background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 16, padding: '20px', cursor: 'pointer' },
  cardIcon: { fontSize: 20, color: colors.cyan, marginBottom: 10, fontWeight: 800 },
  cardName: { fontSize: 15, fontWeight: 700, marginBottom: 4 },
  cardMeta: { fontSize: 11.5, color: colors.subtext, marginBottom: 8 },
  cardId: { fontSize: 10, color: colors.faint, wordBreak: 'break-all' },
  deleteBtn: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: colors.faint, fontSize: 10.5, cursor: 'pointer', textDecoration: 'underline' },
  empty: { color: colors.subtext, fontSize: 13.5, gridColumn: '1 / -1' },
}
