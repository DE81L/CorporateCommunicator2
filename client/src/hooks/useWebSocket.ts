// client/src/hooks/useWebSocket.ts
import { useState, useEffect, useRef } from "react";

export type ConnectionStatus =
  | "connecting"
  | "open"
  | "closing"
  | "closed"
  | "error";

// Структура ваших сообщений
export interface WebSocketMessage {
  // пример полей, скорректируйте под ваш протокол
  senderId: number;
  text: string;
  to?: number;
}

// Собираем правильный WS-URL
const WS_URL: string = (() => {
  // 1) если явно задана переменная — используем её:
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  // 2) иначе, берём dev-сервер и меняем http(s) → ws(s)
  const dev = import.meta.env.VITE_DEV_SERVER_URL;
  if (dev) {
    try {
      const u = new URL(dev);
      const protocol = u.protocol === "https:" ? "wss" : "ws";
      return `${protocol}://${u.host}/ws`;
    } catch {
      // fallthrough
    }
  }
  // 3) по умолчанию — текущий хост
  const loc = window.location;
  const protocol = loc.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${loc.host}/ws`;
})();

export function useWebSocket() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    "connecting"
  );
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setConnectionStatus("connecting");
    const ws = new WebSocket(WS_URL);

    ws.addEventListener("open", () => {
      setConnectionStatus("open");
    });

    ws.addEventListener("message", (evt) => {
      try {
        const msg = JSON.parse(evt.data) as WebSocketMessage;
        setLastMessage(msg);
      } catch {
        console.warn("Invalid WS message:", evt.data);
      }
    });

    ws.addEventListener("close", () => {
      setConnectionStatus("closed");
    });
    ws.addEventListener("error", () => {
      setConnectionStatus("error");
    });

    wsRef.current = ws;
    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = (text: string, to?: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text, to }));
    } else {
      console.error("WS is not open:", wsRef.current?.readyState);
    }
  };

  return { connectionStatus, lastMessage, sendMessage };
}
