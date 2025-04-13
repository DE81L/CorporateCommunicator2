import { useCallback, useEffect, useState } from 'react';

export interface WSLikeMessage {
  senderId: number;
  content: string;
  createdAt: string;
  id: number;
  sender: { id: number; username: string };
}

export function useWebSocket() {
  const [lastMessage, setLastMessage] = useState<WSLikeMessage | null>(null);

  /* входящие IPC */
  useEffect(() => {
    window.chatAPI.onMessage((m) => {
      setLastMessage({
        id: m.ts,
        senderId: m.from === 'user1' ? 1 : 2,
        content: m.text,
        createdAt: new Date(m.ts).toISOString(),
        sender: { id: m.from === 'user1' ? 1 : 2, username: m.from },
      });
    });
  }, []);

  /* исходящие IPC */
  const sendMessage = useCallback((text: string) => {
    const msg = {
      from: window.localStorage.getItem('username') || 'user1',
      text,
      ts: Date.now(),
    };
    window.chatAPI.sendMessage(msg);
  }, []);

  return {
    sendMessage,
    lastMessage,
    connectionStatus: "open",
    readyState: 1,
  };
}
