import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import AuthPage from "./pages/auth-page"; // Remove .tsx extension
import HomePage from "./pages/home-page";
import SettingsPage from "./pages/settings-page";
import NotFound from "./pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import { WindowFrame } from "./components/ui/window-frame";
import { useElectron } from "./hooks/use-electron";
import { LanguageProvider } from "./lib/i18n/LanguageContext";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './components/language-switcher';
import i18n from './i18n';

// Main router component
function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <AuthPage />} />
      <ProtectedRoute path="/home" component={() => <HomePage />} />
      <ProtectedRoute path="/settings" component={() => <SettingsPage />} />
      <Route component={() => <NotFound />} />
    </Switch>
  );
}

// Environment indicator component (only shown in development)
function EnvironmentIndicator() {
  const { isElectron, version } = useElectron();
  const isDev = import.meta.env.DEV;
  
  if (!isDev) return null;
  
  return (
    <div className="fixed bottom-2 right-2 bg-primary/10 text-primary text-xs px-2 py-1 rounded-md backdrop-blur-sm z-50">
      {isElectron ? 'Electron' : 'Web'}
      {version && ` (${version})`}
    </div>
  );
}

// App component
function App() {
  const { isElectron } = useElectron();
  const [isInitialized, setIsInitialized] = useState(false);
  const { t } = useTranslation();
  
  // Initialize environment and i18n
  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize i18n
        await i18n.init({
          fallbackLng: 'en',
          debug: import.meta.env.DEV,
        });

        // Any additional initialization can go here
        console.log(`Application running in ${isElectron ? 'Electron' : 'web'} mode`);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization failed:', error);
        // Handle initialization error appropriately
      }
    };
    
    initApp();
  }, [isElectron]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
 <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <div className="flex flex-col h-screen">
            {/* Only show window frame in Electron */}
            {isElectron && <WindowFrame />}
            
            {/* Header */}
            <header className="flex justify-between items-center p-4">
              <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
              <LanguageSwitcher />
            </header>
            
            {/* Main content area with conditional padding */}
            <div 
              className={`flex-1 overflow-auto ${
                isElectron ? "pt-0" : ""
              }`}
            >
              <Router />
            </div>
            
            {/* Environment indicator for development */}
            <EnvironmentIndicator />
          </div>
          <Toaster />
 </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
