import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as fabric from 'fabric'
import client from '../api/client'
import { useBoardSocket } from '../hooks/useBoardSocket'
import { colors, fonts } from '../styles'

const TOOLS = [
  { key: 'select', label: 'Select' },
  { key: 'pen', label: 'Pen' },
  { key: 'eraser', label: 'Eraser' },
  { key: 'rect', label: 'Rectangle' },
  { key: 'circle', label: 'Circle' },
  { key: 'line', label: 'Line' },
  { key: 'text', label: 'Text' },
]

const PALETTE = [colors.text, colors.indigo, colors.coral, colors.lime, '#4ade80', '#60a5fa']
const ERASER_RADIUS = 16
const MIN_ZOOM = 0.15
const MAX_ZOOM = 6

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function Board() {
  const { boardId } = useParams()
  const navigate = useNavigate()

  const canvasElRef = useRef(null)
  const fabricRef = useRef(null)
  const containerRef = useRef(null)

  const toolRef = useRef('select')
  const colorRef = useRef(PALETTE[0])
  const strokeWidthRef = useRef(3)
  const drawingShapeRef = useRef(null)
  const applyingRemoteRef = useRef(false)
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  const elementVersionsRef = useRef({})
  const isErasingRef = useRef(false)
  const isPanningRef = useRef(false)
  const spaceHeldRef = useRef(false)
  const lastPanPointRef = useRef(null)
  const lockedObjectIdRef = useRef(null)

  const [boardName, setBoardName] = useState('')
  const [tool, setTool] = useState('select')
  const [color, setColor] = useState(PALETTE[0])
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [activeUsers, setActiveUsers] = useState([])
  const [cursors, setCursors] = useState({})
  const [locks, setLocks] = useState({})
  const [lockWarning, setLockWarning] = useState('')
  const [zoomPct, setZoomPct] = useState(100)

  const cursorThrottleRef = useRef(0)

  const handleMessage = useCallback((message) => {
    const canvas = fabricRef.current
    if (!canvas) return

    switch (message.type) {
      case 'active_users':
        setActiveUsers(message.users)
        return
      case 'user_joined':
        setActiveUsers((prev) => [...prev.filter((u) => u.user_id !== message.user.user_id), message.user])
        return
      case 'user_left':
        setActiveUsers((prev) => prev.filter((u) => u.user_id !== message.user_id))
        setCursors((prev) => { const n = { ...prev }; delete n[message.user_id]; return n })
        return
      case 'cursor_move':
        setCursors((prev) => ({ ...prev, [message.user_id]: { x: message.x, y: message.y, name: message.name, color: message.color } }))
        return
      case 'element_add':
      case 'element_update':
        elementVersionsRef.current[message.element.id] = message.element.version
        applyRemoteElement(canvas, message.element)
        return
      case 'element_conflict':
        elementVersionsRef.current[message.element.id] = message.element.version
        applyRemoteElement(canvas, message.element)
        return
      case 'element_delete':
        removeElementById(canvas, message.element_id)
        delete elementVersionsRef.current[message.element_id]
        return
      case 'element_lock':
        setLocks((prev) => ({ ...prev, [message.element_id]: { name: message.name, color: message.color } }))
        return
      case 'element_unlock':
        setLocks((prev) => { const n = { ...prev }; delete n[message.element_id]; return n })
        return
      default:
        return
    }
  }, [])

  const { send } = useBoardSocket(boardId, handleMessage)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [boardRes, elementsRes] = await Promise.all([
          client.get(`/boards/${boardId}`),
          client.get(`/boards/${boardId}/elements`),
        ])
        if (cancelled) return
        setBoardName(boardRes.data.name)

        applyingRemoteRef.current = true
        for (const el of elementsRes.data) {
          elementVersionsRef.current[el.element_id] = el.version || 1
          await applyRemoteElement(fabricRef.current, {
            id: el.element_id, type: el.type, data: el.data, color: el.color, stroke_width: el.stroke_width,
          })
        }
        applyingRemoteRef.current = false
        fabricRef.current?.requestRenderAll()
      } catch (err) {
        console.error('Failed to load board', err)
      }
    }

    const waitForCanvas = setInterval(() => {
      if (fabricRef.current) { clearInterval(waitForCanvas); load() }
    }, 50)

    return () => { cancelled = true; clearInterval(waitForCanvas) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasElRef.current, { backgroundColor: '#ffffff', selection: true })
    fabricRef.current = canvas

    const resize = () => {
      if (!containerRef.current) return
      canvas.setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
    }
    resize()
    window.addEventListener('resize', resize)

    canvas.on('path:created', (e) => {
      if (applyingRemoteRef.current) return
      const path = e.path
      path.id = uid()
      elementVersionsRef.current[path.id] = 1
      pushUndo({ kind: 'add', id: path.id })
      broadcastElement(path, 'element_add')
    })

    canvas.on('object:modified', (e) => {
      if (applyingRemoteRef.current) return
      const obj = e.target
      if (!obj || !obj.id) return
      broadcastElement(obj, 'element_update')
    })

    canvas.on('selection:created', (e) => handleSelectionChange(e.selected))
    canvas.on('selection:updated', (e) => handleSelectionChange(e.selected))
    canvas.on('selection:cleared', () => releaseMyLock())

    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY
      let z = canvas.getZoom()
      z *= 0.999 ** delta
      z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, z)
      setZoomPct(Math.round(z * 100))
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })

    canvas.on('mouse:down', (opt) => handleMouseDown(opt))
    canvas.on('mouse:move', (opt) => handleMouseMove(opt))
    canvas.on('mouse:up', () => handleMouseUp())

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !spaceHeldRef.current) {
        spaceHeldRef.current = true
        canvas.defaultCursor = 'grab'
        canvas.selection = false
      }
    }
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false
        isPanningRef.current = false
        canvas.defaultCursor = toolRef.current === 'select' ? 'default' : 'crosshair'
        canvas.selection = toolRef.current === 'select'
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { strokeWidthRef.current = strokeWidth }, [strokeWidth])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.isDrawingMode = tool === 'pen'
    canvas.selection = tool === 'select'
    if (tool === 'pen') {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
      canvas.freeDrawingBrush.color = color
      canvas.freeDrawingBrush.width = strokeWidth
    }
    canvas.forEachObject((obj) => {
      obj.selectable = tool === 'select'
      obj.evented = tool === 'select' || tool === 'eraser'
    })
  }, [tool, color, strokeWidth])

  function handleSelectionChange(selected) {
    const obj = selected && selected[0]
    if (!obj || !obj.id) return

    const lockedBy = locks[obj.id]
    if (lockedBy) {
      fabricRef.current.discardActiveObject()
      fabricRef.current.requestRenderAll()
      setLockWarning(`${lockedBy.name} is already editing this`)
      setTimeout(() => setLockWarning(''), 1600)
      return
    }

    releaseMyLock()
    lockedObjectIdRef.current = obj.id
    send({ type: 'element_lock', element_id: obj.id })
  }

  function releaseMyLock() {
    if (lockedObjectIdRef.current) {
      send({ type: 'element_unlock', element_id: lockedObjectIdRef.current })
      lockedObjectIdRef.current = null
    }
  }

  function broadcastElement(obj, type) {
    const data = obj.toObject(['id'])
    const payload = {
      type,
      element: { id: obj.id, type: data.type, data, color: obj.stroke || obj.fill || colorRef.current, stroke_width: obj.strokeWidth || 1 },
    }
    if (type === 'element_update') {
      payload.base_version = elementVersionsRef.current[obj.id] || 1
      elementVersionsRef.current[obj.id] = payload.base_version + 1
    }
    send(payload)
  }

  async function applyRemoteElement(canvas, element) {
    if (!canvas) return
    try {
      removeElementById(canvas, element.id, true)
      const wasApplyingRemote = applyingRemoteRef.current
      applyingRemoteRef.current = true
      const enlivened = await fabric.util.enlivenObjects([element.data])
      enlivened.forEach((obj) => {
        obj.id = element.id
        obj.selectable = toolRef.current === 'select'
        obj.evented = toolRef.current === 'select' || toolRef.current === 'eraser'
        canvas.add(obj)
      })
      applyingRemoteRef.current = wasApplyingRemote
      canvas.requestRenderAll()
    } catch (err) {
      console.error('Could not apply remote element', element, err)
    }
  }

  function removeElementById(canvas, elementId, silent = false) {
    if (!canvas) return
    const obj = canvas.getObjects().find((o) => o.id === elementId)
    if (obj) { canvas.remove(obj); if (!silent) canvas.requestRenderAll() }
  }

  function handleMouseDown(opt) {
    const canvas = fabricRef.current
    const currentTool = toolRef.current

    if (spaceHeldRef.current) {
      isPanningRef.current = true
      lastPanPointRef.current = { x: opt.e.clientX, y: opt.e.clientY }
      canvas.defaultCursor = 'grabbing'
      return
    }

    const pointer = canvas.getScenePoint(opt.e)

    if (currentTool === 'eraser') {
      isErasingRef.current = true
      eraseNear(opt.e)
      return
    }

    if (currentTool === 'text') {
      const text = new fabric.Textbox('Type here', { left: pointer.x, top: pointer.y, fill: colorRef.current, fontSize: 20, width: 200 })
      text.id = uid()
      canvas.add(text)
      canvas.setActiveObject(text)
      elementVersionsRef.current[text.id] = 1
      pushUndo({ kind: 'add', id: text.id })
      broadcastElement(text, 'element_add')
      return
    }

    if (['rect', 'circle', 'line'].includes(currentTool)) {
      let shape
      const common = { left: pointer.x, top: pointer.y, stroke: colorRef.current, strokeWidth: strokeWidthRef.current, fill: 'transparent', selectable: false, evented: false }
      if (currentTool === 'rect') shape = new fabric.Rect({ ...common, width: 1, height: 1 })
      if (currentTool === 'circle') shape = new fabric.Circle({ ...common, radius: 1 })
      if (currentTool === 'line') shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], { stroke: colorRef.current, strokeWidth: strokeWidthRef.current, selectable: false, evented: false })
      shape.id = uid()
      canvas.add(shape)
      drawingShapeRef.current = { startX: pointer.x, startY: pointer.y, shape }
    }
  }

  function eraseNear(domEvent) {
    const canvas = fabricRef.current
    const pointer = canvas.getScenePoint(domEvent)
    const zoom = canvas.getZoom()
    const radius = ERASER_RADIUS / zoom

    const toRemove = canvas.getObjects().filter((obj) => {
      if (!obj.id) return false
      const rect = obj.getBoundingRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      return Math.hypot(pointer.x - cx, pointer.y - cy) < radius + Math.max(rect.width, rect.height) / 2
    })

    toRemove.forEach((obj) => {
      pushUndo({ kind: 'remove', id: obj.id, data: obj.toObject(['id']) })
      canvas.remove(obj)
      send({ type: 'element_delete', element_id: obj.id })
      delete elementVersionsRef.current[obj.id]
    })
    if (toRemove.length) canvas.requestRenderAll()
  }

  function handleMouseMove(opt) {
    const canvas = fabricRef.current

    if (isPanningRef.current && lastPanPointRef.current) {
      const dx = opt.e.clientX - lastPanPointRef.current.x
      const dy = opt.e.clientY - lastPanPointRef.current.y
      canvas.relativePan({ x: dx, y: dy })
      lastPanPointRef.current = { x: opt.e.clientX, y: opt.e.clientY }
      return
    }

    if (isErasingRef.current) {
      eraseNear(opt.e)
    }

    const drawing = drawingShapeRef.current
    const pointer = canvas.getScenePoint(opt.e)

    if (drawing) {
      const { startX, startY, shape } = drawing
      if (shape.type === 'rect') {
        shape.set({ left: Math.min(startX, pointer.x), top: Math.min(startY, pointer.y), width: Math.abs(pointer.x - startX), height: Math.abs(pointer.y - startY) })
      } else if (shape.type === 'circle') {
        const radius = Math.hypot(pointer.x - startX, pointer.y - startY) / 2
        shape.set({ left: Math.min(startX, pointer.x), top: Math.min(startY, pointer.y), radius })
      } else if (shape.type === 'line') {
        shape.set({ x2: pointer.x, y2: pointer.y })
      }
      canvas.requestRenderAll()
    }

    const now = Date.now()
    if (now - cursorThrottleRef.current > 40) {
      cursorThrottleRef.current = now
      send({ type: 'cursor_move', x: pointer.x, y: pointer.y })
    }
  }

  function handleMouseUp() {
    const canvas = fabricRef.current
    if (isPanningRef.current) {
      isPanningRef.current = false
      canvas.defaultCursor = 'grab'
      return
    }
    isErasingRef.current = false

    const drawing = drawingShapeRef.current
    if (!drawing) return
    const { shape } = drawing
    shape.set({ selectable: toolRef.current === 'select', evented: toolRef.current === 'select' })
    drawingShapeRef.current = null
    elementVersionsRef.current[shape.id] = 1
    pushUndo({ kind: 'add', id: shape.id })
    broadcastElement(shape, 'element_add')
  }

  function pushUndo(action) { undoStackRef.current.push(action); redoStackRef.current = [] }

  function handleUndo() {
    const action = undoStackRef.current.pop()
    if (!action) return
    const canvas = fabricRef.current

    if (action.kind === 'add') {
      const obj = canvas.getObjects().find((o) => o.id === action.id)
      if (obj) {
        redoStackRef.current.push({ kind: 'add', id: action.id, data: obj.toObject(['id']) })
        canvas.remove(obj)
        send({ type: 'element_delete', element_id: action.id })
        delete elementVersionsRef.current[action.id]
      }
    } else if (action.kind === 'remove') {
      applyRemoteElement(canvas, { id: action.id, type: action.data.type, data: action.data, color: colorRef.current })
      elementVersionsRef.current[action.id] = 1
      redoStackRef.current.push({ kind: 'remove', id: action.id })
      send({ type: 'element_add', element: { id: action.id, type: action.data.type, data: action.data, color: colorRef.current, stroke_width: 1 } })
    }
    canvas.requestRenderAll()
  }

  function handleRedo() {
    const action = redoStackRef.current.pop()
    if (!action) return
    const canvas = fabricRef.current

    if (action.kind === 'add') {
      applyRemoteElement(canvas, { id: action.id, type: action.data.type, data: action.data, color: colorRef.current })
      elementVersionsRef.current[action.id] = 1
      undoStackRef.current.push({ kind: 'add', id: action.id })
      send({ type: 'element_add', element: { id: action.id, type: action.data.type, data: action.data, color: colorRef.current, stroke_width: 1 } })
    } else if (action.kind === 'remove') {
      const obj = canvas.getObjects().find((o) => o.id === action.id)
      if (obj) {
        canvas.remove(obj)
        undoStackRef.current.push({ kind: 'remove', id: action.id, data: obj.toObject(['id']) })
        send({ type: 'element_delete', element_id: action.id })
        delete elementVersionsRef.current[action.id]
      }
    }
    canvas.requestRenderAll()
  }

  function resetZoom() {
    const canvas = fabricRef.current
    canvas.setZoom(1)
    canvas.absolutePan({ x: 0, y: 0 })
    setZoomPct(100)
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button className="tap" style={styles.backBtn} onClick={() => navigate('/dashboard')}>&#8592;</button>
        <div style={styles.boardName}>{boardName || 'Loading...'}</div>

        <div style={styles.usersRow}>
          {activeUsers.map((u) => (
            <div key={u.user_id} style={{ ...styles.userDot, background: u.color }} title={u.name}>{u.name?.[0]?.toUpperCase()}</div>
          ))}
        </div>

        <button style={styles.copyBtn} onClick={() => { navigator.clipboard.writeText(boardId); alert('Board ID copied') }}>Copy Board ID</button>
      </div>

      <div style={styles.toolbar}>
        {TOOLS.map((t) => (
          <button
            key={t.key}
            className="tap"
            style={{ ...styles.toolBtn, background: tool === t.key ? colors.gradientBrand : 'rgba(255,255,255,0.05)', color: tool === t.key ? '#100a26' : colors.text }}
            onClick={() => setTool(t.key)}
          >
            {t.label}
          </button>
        ))}

        <div style={styles.divider} />
        {PALETTE.map((c) => (
          <button key={c} className="tap" style={{ ...styles.swatch, background: c, outline: color === c ? `2px solid ${colors.lime}` : 'none' }} onClick={() => setColor(c)} />
        ))}
        <input type="range" min="1" max="20" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} style={styles.slider} />

        <div style={styles.divider} />
        <button className="tap" style={styles.toolBtn} onClick={handleUndo}>Undo</button>
        <button className="tap" style={styles.toolBtn} onClick={handleRedo}>Redo</button>

        <div style={styles.divider} />
        <div style={styles.zoomLabel}>{zoomPct}%</div>
        <button className="tap" style={styles.toolBtn} onClick={resetZoom}>Reset View</button>
        <div style={styles.hint}>Scroll to zoom, hold Space and drag to pan</div>
      </div>

      <div ref={containerRef} style={styles.canvasWrap}>
        <canvas ref={canvasElRef} />
        {Object.entries(cursors).map(([userId, c]) => (
          <div key={userId} style={{ ...styles.cursor, left: c.x, top: c.y }}>
            <div style={{ ...styles.cursorDot, background: c.color }} />
            <div style={{ ...styles.cursorLabel, background: c.color }}>{c.name}</div>
          </div>
        ))}
        {lockWarning && <div style={styles.lockWarning}>{lockWarning}</div>}
      </div>
    </div>
  )
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh' },
  topBar: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: `1px solid ${colors.border}` },
  backBtn: { width: 32, height: 32, borderRadius: 9, border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.04)', color: colors.text, cursor: 'pointer' },
  boardName: { fontSize: 15.5, fontWeight: 700, fontFamily: fonts.display, flex: 1 },
  usersRow: { display: 'flex', gap: 6 },
  userDot: { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#100a26' },
  copyBtn: { padding: '7px 14px', borderRadius: 9, border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.04)', color: colors.text, fontSize: 11.5, cursor: 'pointer' },
  toolbar: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderBottom: `1px solid ${colors.border}`, flexWrap: 'wrap' },
  toolBtn: { padding: '8px 14px', borderRadius: 9, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
  divider: { width: 1, height: 22, background: colors.border, margin: '0 4px' },
  swatch: { width: 22, height: 22, borderRadius: '50%', border: `1px solid ${colors.border}`, cursor: 'pointer' },
  slider: { width: 90 },
  zoomLabel: { fontSize: 12, color: colors.subtext, fontWeight: 700, minWidth: 40 },
  hint: { fontSize: 11, color: colors.faint, marginLeft: 'auto' },
  canvasWrap: { position: 'relative', flex: 1, overflow: 'hidden' },
  cursor: { position: 'absolute', pointerEvents: 'none', transform: 'translate(-2px, -2px)', zIndex: 10 },
  cursorDot: { width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff' },
  cursorLabel: { position: 'absolute', top: 12, left: 8, padding: '2px 7px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, color: '#100a26', whiteSpace: 'nowrap' },
  lockWarning: { position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,15,40,0.92)', border: `1px solid ${colors.border}`, color: colors.text, padding: '9px 18px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, zIndex: 20 },
}
