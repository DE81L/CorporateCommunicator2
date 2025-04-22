import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { WindowFrame } from "./components/ui/window-frame";
import EnvironmentIndicator from "./components/electron-info";
import { useElectron } from "./hooks/use-electron";
import HomePage from "./pages/home-page";
import AuthPage from "./pages/auth-page";

function InnerApp() {
    const isElectron = useElectron();
    const { user } = useAuth();


    return (
        <div className="flex flex-col h-screen">
            {isElectron && <WindowFrame />}
            <EnvironmentIndicator />
            <Toaster />
            <div className={`flex-1 overflow-auto ${isElectron ? "pt-0" : ""}`}>
                {user ? <HomePage /> : <AuthPage />}
            </div>
        </div>
    );
}

export default function App() {

    const isElectron = useElectron();
    const queryClient = new QueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <InnerApp />
            </AuthProvider>
        </QueryClientProvider>
    );
}
