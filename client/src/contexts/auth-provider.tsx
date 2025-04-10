import { createContext, useEffect, useState, useCallback } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  sendIPC: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } finally {
      setLoading(false);
    }
  } 

  const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        try {
          // Placeholder: replace with actual login logic
          const response = await fetch("/api/auth/login", {method: 'POST', body: JSON.stringify({email, password})});
          const userData = await response.json()
          setUser(userData); // Update user state upon successful login
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setUser(null);
    }, []);

    const sendIPC = () => {};

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, sendIPC }}>
            {children}
        </AuthContext.Provider>
    );
}
