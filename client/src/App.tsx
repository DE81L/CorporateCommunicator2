import React from 'react';
import { Toaster } from 'react-hot-toast';
import AuthPage from './pages/auth-page';
import HomePage from "./pages/home-page";
import SettingsPage from './pages/settings-page';
import AdminPage from './pages/admin-page';
import WikiArticlePage from './pages/wiki-article-page';
import { Route, Switch, Redirect } from 'wouter';
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ChatProvider } from "./context/ChatContext";
import { WindowFrameHeader } from "./components/ui/window-frame";
import { useElectron } from "./hooks/use-electron";
import { useEffect, useState } from "react";
import { showError } from "@/lib/error-toast";
import { createApiClient } from "@/lib/api-client";
import ServerDownBanner from "./components/server-down-banner";
import { useUserStatusHeartbeat } from "./hooks/useUserStatus";

function AppContent() {
  const { user, isLoading } = useAuth();
  const { isElectron } = useElectron();
  useUserStatusHeartbeat();

  useEffect(() => {
    if (isElectron) {
      document.body.classList.add('electron');
    }
  }, [isElectron]);

  // 1. Show a loading state while we check /api/user
  if (isLoading) return <div className="p-4">Loading…</div>;

  return (
    <div className="flex flex-col h-screen">
      {isElectron && <WindowFrameHeader />}
      <Toaster />
      <div className="flex-1 overflow-auto">
        <Switch>
          <Route path="/auth">
            {user ? <Redirect to="/" /> : <AuthPage />}
          </Route>
          <Route path="/settings">
            {user ? <SettingsPage /> : <Redirect to="/auth" />}
          </Route>
          <Route path="/admin">
            {user && user.isAdmin ? <AdminPage /> : <Redirect to="/" />}
          </Route>
          <Route path="/wiki/:id">
            {user ? <WikiArticlePage /> : <Redirect to="/auth" />}
          </Route>
          <Route>
            {user ? <HomePage /> : <Redirect to="/auth" />}
          </Route>
        </Switch>
      </div>
    </div>
  );
}

import { queryClient } from './lib/queryClient';

export default function App() {
  const [status, setStatus] = useState('loading');

  const apiClient = createApiClient();

  useEffect(() => {
    apiClient
      .request<{ status: string }>('/api/health')
      .then(data => setStatus(data?.status ?? 'error'))
      .catch(() => setStatus('error'));

    apiClient
      .request<{ message: string }>('/api/hello')
      .catch(err => showError(err));
  }, [apiClient]);


  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatProvider>
          <AppContent />
          {status === 'error' && (
            <ServerDownBanner onReload={() => window.location.reload()} />
          )}
        </ChatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
