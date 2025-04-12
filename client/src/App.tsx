
import { Toaster } from 'react-hot-toast';

import HomePage from './pages/home-page';
import { LanguageProvider } from './lib/i18n/LanguageContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/auth-provider";
import { WindowFrame } from "./components/ui/window-frame";
import EnvironmentIndicator from "./components/electron-info";
import { useElectron } from "./hooks/use-electron";
import { ProtectedRoute } from "./lib/protected-route";

export default function App() {
  const isElectron = useElectron();
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <EnvironmentIndicator />
          <Toaster />
          <div className="flex flex-col h-screen">
            {/* Only show window frame in Electron */}
              {isElectron && <WindowFrame />}
            {/* Main content area with conditional padding */}
            <div className={`flex-1 overflow-auto ${isElectron ? 'pt-0' : ''}`}>
              <ProtectedRoute path="/" component={HomePage} />
            </div>
            </div>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
