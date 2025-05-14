import { useEffect, useState } from "react";

export function useWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const websocket = new WebSocket(url);
    websocket.onopen = () => setConnected(true);
    websocket.onmessage = (event) => setLastMessage(JSON.parse(event.data));
    websocket.onclose = () => setConnected(false);
    setWs(websocket);
    return () => websocket.close();
  }, [url]);

  return {
    connected,
    sendMessage: (msg: string) => ws?.send(msg),
    lastMessage,
  };
}
