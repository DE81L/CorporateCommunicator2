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
const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  'ws://localhost:4000/ws';

    export function useWebSocket() {
      const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
      const [lastRawMessage, setLastRawMessage] = useState<WSMessage | null>(null);
      const wsRef = useRef<WebSocket | null>(null);

      useEffect(() => {
        setConnectionStatus('connecting');

      
      const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:4000/ws`; // Используем порт 4000 напрямую
      const ws = new WebSocket(wsUrl); 

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

  const sendRaw = (msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.error('WS not open:', wsRef.current?.readyState);
    }
  };

  return { connectionStatus, lastRawMessage, sendRaw };
}