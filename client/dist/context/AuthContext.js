import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        api.get('/api/auth/me').then((u) => setUser(u))
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
    }, []);
    const login = async (email, password) => {
        const user = await api.post('/api/auth/login', { email, password });
        setUser(user);
    };
    const logout = async () => {
        await api.post('/api/auth/logout', {});
        setUser(null);
    };
    return (_jsx(AuthContext.Provider, { value: { user, isLoading, login, logout }, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
