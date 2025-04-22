import { Toaster } from 'react-hot-toast';
import AuthPage from './pages/auth-page';
import HomePage from "./pages/home-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { WindowFrame } from "./components/ui/window-frame";
import EnvironmentIndicator from "./components/electron-info";
import { useElectron } from "./hooks/use-electron";

function AppContent() {
  const { user, isLoading } = useAuth();
  const isElectron = useElectron();

  // 1. Show a loading state while we check /api/user
  if (isLoading) return <div className="p-4">Loading…</div>;

  // 2. Not logged in? Show the AuthPage (no Redirect needed)
  if (!user) return <AuthPage />;

  // 3. Logged in! Render your real app shell
  return (
    <div className="flex flex-col h-screen">
      {isElectron && <WindowFrame />}
      <EnvironmentIndicator />
      <Toaster />
      <div className="flex-1 overflow-auto">
        {/* Now rendering your real home screen */}
        <HomePage />
      </div>
    </div>
  );
}

export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
