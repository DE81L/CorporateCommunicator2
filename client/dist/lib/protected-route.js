import { jsx as _jsx } from "react/jsx-runtime";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
export function ProtectedRoute({ path, component: Component }) {
    function AuthWrapper() {
        const { user, isLoading } = useAuth();
        if (isLoading) {
            return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
        }
        if (!user) {
            return _jsx(Redirect, { to: "/auth" });
        }
        return _jsx(Component, {});
    }
    return (_jsx(Route, { path: path, children: () => _jsx(AuthWrapper, {}) }));
}
