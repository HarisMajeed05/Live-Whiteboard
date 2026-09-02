import { useEffect, useRef, useCallback } from 'react'
import { WS_BASE } from '../api/client'

export function useBoardSocket(boardId, onMessage) {
  const wsRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    const token = localStorage.getItem('token')
    const ws = new WebSocket(`${WS_BASE}/board/${boardId}?token=${encodeURIComponent(token)}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        onMessageRef.current(message)
      } catch (err) {
        console.error('Bad WebSocket message', err)
      }
    }

    ws.onerror = (err) => console.error('WebSocket error', err)

    return () => {
      ws.close()
    }
  }, [boardId])

  const send = useCallback((message) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }, [])

  return { send }
}
