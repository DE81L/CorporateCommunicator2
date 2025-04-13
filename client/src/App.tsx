
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
  const [me, setMe] = useState('user?');
  const [chat, setChat] = useState<Msg[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    window.chatAPI.bootstrap(({ username, chat }) => {
      setMe(username);
      setChat(chat);
    });
    window.chatAPI.onMessage((m) => setChat(c => [...c, m]));
  }, []);

  return (
    <div style={{padding:16,fontFamily:'sans-serif'}}>
      <h2>{me}</h2>
      <div style={{border:'1px solid #ccc',height:400,overflowY:'auto',padding:8,marginBottom:8}}>
        {chat.map(m=>(
          <div key={m.ts} style={{textAlign:m.from===me?'right':'left'}}>
            <b>{m.from}</b>: {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={e=>{e.preventDefault(); if(text) {window.chatAPI.send(me,text); setText('');}}}>
        <input value={text} onChange={e=>setText(e.target.value)} style={{width:'80%'}} autoFocus/>
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

