// client/src/hooks/useWebSocket.ts

import { useState, useEffect, useRef, useCallback } from 'react'
import { showError } from '@/lib/error-toast'
import { useAuth } from '@/hooks/use-auth'

export type WSMessage<T = any> = { type: string; payload: T }
export type ConnectionStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error'

// формируем итоговый URL WebSocket:
//  • если VITE_WS_URL задан и абсолютный — используем его
//  • если VITE_WS_URL начинается с '/', проксируем через текущий хост
//  • иначе используем ws(s)://<текущий хост>/ws
const _raw = (import.meta.env.VITE_WS_URL as string | undefined)

const WS_URL = _raw
  ? _raw.startsWith('/')
    ? `${window.location.protocol.replace(/^http/, 'ws')}//${window.location.host}${_raw}`
    : _raw
  : `${window.location.protocol.replace(/^http/, 'ws')}//${window.location.host}/ws`

export function useWebSocket() {
  const { user, logout } = useAuth()

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('closed')
  const [lastRawMessage, setLastRawMessage] = useState<WSMessage | null>(null)
  const MAX_RETRIES = 5
  const [retriesLeft, setRetriesLeft] = useState(MAX_RETRIES)

  const wsRef = useRef<WebSocket | null>(null)
  const retries = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectRef = useRef<() => void>(() => {})

  useEffect(() => {
    let cancelled = false

    if (!user) {
      wsRef.current?.close()
      setConnectionStatus('closed')
      return
    }

    const connect = () => {
      console.debug('WS connect attempt', retries.current)
      setConnectionStatus('connecting')
      const url = new URL(WS_URL, window.location.href)
      if (user) url.searchParams.set('userId', String(user.id))
      const ws = new WebSocket(url.toString())
      wsRef.current = ws
      connectRef.current = connect

      ws.addEventListener('open', () => {
        console.info('WebSocket open')
        setConnectionStatus('open')
        retries.current = 0
        setRetriesLeft(MAX_RETRIES)
      })

      ws.addEventListener('message', (evt) => {
        console.debug('WS message', evt.data)
        try {
          setLastRawMessage(JSON.parse(evt.data))
        } catch (err) {
          showError(err, 'Failed to parse WS message')
        }
      })

      ws.addEventListener('close', (evt) => {
        console.info('WebSocket closed', evt.code, evt.reason)
        if (evt.code === 4401) {
          logout()
          return
        }
        setConnectionStatus('closed')
        if (!cancelled && retries.current < MAX_RETRIES) {
          const backoff = Math.pow(2, retries.current) * 1000
          retries.current += 1
          setRetriesLeft(MAX_RETRIES - retries.current)
          reconnectTimer.current = setTimeout(connect, backoff)
        }
      })

      ws.addEventListener('error', (err) => {
        showError(err, 'WebSocket error')
        setConnectionStatus('error')
      })
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
      if (wsRef.current) {
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onerror = null
        wsRef.current.onclose = null
        if (wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.addEventListener('open', () => wsRef.current?.close())
        } else {
          wsRef.current.close()
        }
      }
    }
  }, [user])

  const sendRaw = (msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    } else {
      showError('WS not open')
    }
  }

  // const sendCallRequest = (
  //   to: number,
  //   callType: 'video' | 'audio',
  //   fromName: string,
  // ) => sendRaw({ type: 'call-request', payload: { to, callType, fromName } })

  // const sendCallAccept = (to: number) =>
  //   sendRaw({ type: 'call-accept', payload: { to } })

  // const sendCallReject = (to: number) =>
  //   sendRaw({ type: 'call-reject', payload: { to } })

  const reconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    retries.current = 0
    setRetriesLeft(MAX_RETRIES)
    connectRef.current()
  }, [])

  return {
    connectionStatus,
    lastRawMessage,
    sendRaw,
    // sendCallRequest,
    // sendCallAccept,
    // sendCallReject,
    retriesLeft,
    reconnect,
  }
}
