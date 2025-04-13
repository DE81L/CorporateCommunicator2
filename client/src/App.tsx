
import { useEffect, useState } from 'react';
import HomePage from './pages/home-page';
import { LanguageProvider } from './lib/i18n/LanguageContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/use-auth";
import { WindowFrame } from "./components/ui/window-frame";
import EnvironmentIndicator from "./components/electron-info";
import { useElectron } from "./hooks/use-electron";
import { ProtectedRoute } from "./lib/protected-route";


interface Msg { from: string; text: string; ts: number }

declare global {
  interface Window {
    chatAPI: {
      bootstrap: (fn: (d: { username: string; chat: Msg[] }) => void) => void;
      onMessage: (fn: (m: Msg) => void) => void;
      send: (from: string, text: string) => void;
    };
  }
}


export default function App() {
  const [user, setUser] = useState('');
  const [chat, setChat] = useState<Msg[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    window.chatAPI.bootstrap((data) => {
      setUser(data.username);
      setChat(data.chat);
    });
    window.chatAPI.onMessage((msg) => {
      setChat((prev) => [...prev, msg]);
    });
  }, []);

  const send = () => {
    if (!input) return;
    window.chatAPI.send(user, input);
    setInput('');
  };

  return (
    <div style={{ width: 400, margin: '50px auto' }}>
      <h2 style={{ textAlign: 'center' }}>User: {user}</h2>
      <div
        style={{
          height: 400,
          border: '1px solid #ccc',
          marginBottom: 10,
          overflowY: 'scroll',
          padding: 5,
        }}
      >
        {chat.map((msg, i) => (
          <div key={i}>
            <b>{msg.from}:</b> {msg.text}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        <input
          style={{ flex: 1, padding: '5px' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button style={{ marginLeft: '5px' }} onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}

