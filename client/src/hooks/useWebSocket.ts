// client/src/hooks/useWebSocket.ts
import { useState, useEffect, useRef } from 'react';

export type WSMessage<T = any> = {
  type: string;
  payload: T;
};

export type ConnectionStatus =
  | 'connecting'
  | 'open'
  | 'closing'
  | 'closed'
  | 'error';

// Собираем WS_URL из .env или из window.location
const WS_URL: string = (() => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return (
      import.meta
        .env.VITE_API_URL.replace(/^http/, 'ws')
        .replace(/\/+$/, '') + '/ws'
    );
  }
  const loc = window.location;
  const proto = loc.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${loc.host}/ws`;
})();

export function useWebSocket() {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');
  const [lastRawMessage, setLastRawMessage] = useState<WSMessage | null>(
    null
  );
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setConnectionStatus('connecting');
    const ws = new WebSocket(WS_URL);

    ws.addEventListener('open', () => setConnectionStatus('open'));
    ws.addEventListener('message', (evt) => {
      try {
        const m = JSON.parse(evt.data) as WSMessage;
        setLastRawMessage(m);
      } catch {
        console.warn('Invalid WS frame:', evt.data);
      }
    });
    ws.addEventListener('close', () => setConnectionStatus('closed'));
    ws.addEventListener('error', () => setConnectionStatus('error'));

    wsRef.current = ws;
    return () => ws.close();
  }, []);

  // Универсальная отправка “сырых” сообщений
  const sendRaw = (msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.error('WS not open:', wsRef.current?.readyState);
    }
  };

  return { connectionStatus, lastRawMessage, sendRaw };
}
