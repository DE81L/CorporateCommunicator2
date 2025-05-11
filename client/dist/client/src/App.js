import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    if (isLoading)
        return _jsx("div", { className: "p-4", children: "Loading\u2026" });
    // 2. Not logged in? Show the AuthPage (no Redirect needed)
    if (!user)
        return _jsx(AuthPage, {});
    // 3. Logged in! Render your real app shell
    return (_jsxs("div", { className: "flex flex-col h-screen", children: [isElectron && _jsx(WindowFrameHeader, {}), _jsx(Toaster, {}), _jsx("div", { className: "flex-1 overflow-auto", children: _jsx(HomePage, {}) })] }));
}
import { queryClient } from './lib/queryClient';
export default function App() {
    const [status, setStatus] = useState('Loading...');
    const [message, setMessage] = useState('');
    useEffect(() => {
        // Check server health
        fetch('http://localhost:3000/api/health')
            .then(res => res.json())
            .then(data => setStatus(data.status))
            .catch(err => setStatus('error'));
        // Get hello message
        fetch('http://localhost:3000/api/hello')
            .then(res => res.json())
            .then(data => setMessage(data.message))
            .catch(err => console.error(err));
    }, []);
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsxs(AuthProvider, { children: [_jsx(AppContent, {}), _jsxs("div", { children: [_jsxs("h1", { children: ["Server Status: ", status] }), _jsx("p", { children: message })] })] }) }));
}
