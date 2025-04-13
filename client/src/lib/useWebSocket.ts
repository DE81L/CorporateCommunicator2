import { useEffect, useState } from "react";

type Msg = { from: string; text: string; ts: number };

export function useWebSocket() {
  const [messages, setMessages] = useState<Msg[]>([]);

  /* receive broadcasts from the main process */
  useEffect(() => {
    const handler = (_: unknown, msg: Msg) =>
      setMessages((prev) => [...prev, msg]);
    (window as any).electronAPI.onMessage(handler);
    return () => (window as any).electronAPI.offMessage(handler);
  }, []);

  /** send a message to everyone (including myself) */
  const send = (text: string) => {
    (window as any).electronAPI.sendMessage({
      from: (window as any).__USER_ID__,
      text,
      ts: Date.now(),
    });
  };

  return { messages, send };
}