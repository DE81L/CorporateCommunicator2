import React from 'react';
import { Toaster } from 'react-hot-toast';
import AuthPage from './pages/auth-page';
import HomePage from "./pages/home-page";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { WindowFrameHeader } from "./components/ui/window-frame";
import { useElectron } from "./hooks/use-electron";
import { useEffect, useState } from "react";

function AppContent() {
  const { user, isLoading } = useAuth();
  const { isElectron } = useElectron();

  useEffect(() => {
    if (isElectron) {
      document.body.classList.add('electron');
    }
  }, [isElectron]);

  // 1. Show a loading state while we check /api/user
  if (isLoading) return <div className="p-4">Loading…</div>;

  // 2. Not logged in? Show the AuthPage (no Redirect needed)
  if (!user) return <AuthPage />;

  // 3. Logged in! Render your real app shell
  return (
    <div className="flex flex-col h-screen">
      {isElectron && <WindowFrameHeader />}
      <Toaster />
      <div className="flex-1 overflow-auto">
        {/* Now rendering your real home screen */}
        <HomePage />
      </div>
    </div>
  );
}

import { queryClient } from './lib/queryClient';

export default function App() {
  const [status, setStatus] = useState('Loading...');
  const [message, setMessage] = useState('');

  const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/+$/, '');

useEffect(() => {
  fetch(`${API}/health`)
    .then(res => res.json())
    .then(data => setStatus(data.status))
    .catch(() => setStatus('error'));

  fetch(`${API}/hello`)
    .then(res => res.json())
    .then(data => setMessage(data.message))
    .catch(err => console.error(err));
}, []);


  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <div>
          <h1>Server Status: {status}</h1>
          <p>{message}</p>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
