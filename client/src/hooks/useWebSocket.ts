// client/src/hooks/useWebSocket.ts
import { useState, useEffect, useRef } from 'react';

export type WSMessage<T = any> = { type: string; payload: T };

export type ConnectionStatus =
  | 'connecting'
  | 'open'
  | 'closing'
  | 'closed'
  | 'error';

// единое место правды
const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ||
  `ws://${window.location.hostname}:4000/ws`;

export function useWebSocket() {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');
  const [lastRawMessage, setLastRawMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket;

    const connect = () => {
      setConnectionStatus('connecting');
      ws = new WebSocket(WS_URL);

      ws.addEventListener('open', () => setConnectionStatus('open'));

      ws.addEventListener('message', (evt) => {
        try {
          setLastRawMessage(JSON.parse(evt.data));
        } catch {
          console.warn('Invalid WS frame:', evt.data);
        }
      });

      ws.addEventListener('close', () => {
        setConnectionStatus('closed');
        // простейший авто-reconnect через 3 сек
        setTimeout(connect, 3000);
      });

      ws.addEventListener('error', () => setConnectionStatus('error'));

      wsRef.current = ws;
    };

    connect();
    return () => ws?.close();
  }, []);

  const sendRaw = (msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.error('WS not open:', wsRef.current?.readyState);
    }
  };

  return { connectionStatus, lastRawMessage, sendRaw };
}
