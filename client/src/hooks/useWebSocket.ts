// client/src/hooks/useWebSocket.ts

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'

export type WSMessage<T = any> = { type: string; payload: T }
export type ConnectionStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error'

// build the final WebSocket URL:
//  • if VITE_WS_URL is set and absolute, use it
//  • if VITE_WS_URL starts with '/', proxy through the current host
//  • otherwise fall back to ws(s)://<current host>/ws
const _raw = (import.meta.env.VITE_WS_URL as string | undefined)

const WS_URL = _raw
  ? _raw.startsWith('/')
    ? `${window.location.protocol.replace(/^http/, 'ws')}//${window.location.host}${_raw}`
    : _raw
  : `${window.location.protocol.replace(/^http/, 'ws')}//${window.location.host}/ws`

export function useWebSocket() {
  const { user } = useAuth()

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('closed')
  const [lastRawMessage, setLastRawMessage] = useState<WSMessage | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const retries = useRef(0)

  useEffect(() => {
    let cancelled = false

    const connect = () => {
      console.debug('WS connect attempt', retries.current)
      setConnectionStatus('connecting')
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.addEventListener('open', () => {
        console.info('WebSocket open')
        setConnectionStatus('open')
        retries.current = 0
      })

      ws.addEventListener('message', (evt) => {
        console.debug('WS message', evt.data)
        try {
          setLastRawMessage(JSON.parse(evt.data))
        } catch (err) {
          console.error('Failed to parse WS message:', err)
        }
      })

      ws.addEventListener('close', (evt) => {
        console.info('WebSocket closed', evt.code, evt.reason)
        setConnectionStatus('closed')
        if (!cancelled && retries.current < 5) {
          const backoff = Math.pow(2, retries.current) * 1000
          retries.current += 1
          setTimeout(connect, backoff)
        }
      })

      ws.addEventListener('error', (err) => {
        console.error('WebSocket error:', err)
        setConnectionStatus('error')
      })
    }

    connect()

    return () => {
      cancelled = true
      wsRef.current?.close()
    }
  }, [user])

  const sendRaw = (msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    } else {
      console.error('WS not open:', wsRef.current?.readyState)
    }
  }

  return { connectionStatus, lastRawMessage, sendRaw }
}
