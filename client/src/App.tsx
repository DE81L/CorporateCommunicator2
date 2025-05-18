
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
    <div className="max-w-md mx-auto mt-12">
      <h2 className="text-center mb-4">User: {user}</h2>
      <div className="h-96 border border-gray-300 mb-2 overflow-y-scroll p-2 space-y-2">
        {chat.map((msg, i) => {
          const own = msg.from === user;
          return (
            <div
              key={i}
              className={`flex ${own ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-3 py-2 max-w-xs break-words ${
                  own
                    ? 'bg-blue-200 text-gray-900'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <b className="mr-1">{msg.from}:</b> {msg.text}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex">
        <input
          className="flex-1 p-1 border border-gray-300"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="ml-2 px-3 py-1 border" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}

