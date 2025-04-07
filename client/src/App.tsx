import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import { WindowFrame } from "@/components/ui/window-frame";
import { useElectron } from "@/hooks/use-electron";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isElectron } = useElectron();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <div className="flex flex-col h-screen">
            {isElectron && <WindowFrame />}
            <div className={`flex-1 overflow-auto ${isElectron ? "pt-0" : ""}`}>
              <Router />
            </div>
          </div>
          <Toaster />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
