import { useEffect, useState, useCallback } from 'react';

export interface ChatMsg {
  from: string;
  text: string;
  ts: number;
}

export function useIpcChat(user: string) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);

  useEffect(() => {
    window.chat.onMsg((m: ChatMsg) => setMsgs(p => [...p, m]));
  }, []);

  const send = useCallback((text: string) => {
    const m: ChatMsg = { from: user, text, ts: Date.now() };
    window.chat.send(m);
  }, [user]);

  return { msgs, send };
}