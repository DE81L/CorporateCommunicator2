import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/use-auth"; // Import useAuth from hooks
import { NotificationsPane } from "../NotificationsPane";
import { useLocation } from "wouter";
import { BellIcon, MenuIcon, } from "lucide-react";
import { Button } from "@/components/ui/button"; // Updated import
export default function Header({ toggleSidebar }) {
    const { user, logout } = useAuth();
    const [, setLocation] = useLocation();
    const { t } = useTranslation();
    if (!user)
        return null;
    const handleLogout = useCallback(async () => {
        try {
            await logout();
            setLocation("/auth");
        }
        catch (error) {
            console.error("Logout failed:", error);
        }
    }, [logout, setLocation]);
    const [open, setOpen] = useState(false);
    return (_jsxs("header", { className: "h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-semibold text-primary-600", children: t("common.appName") }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "flex items-center space-x-3", children: _jsx(Button, { variant: "ghost", size: "icon", onClick: toggleSidebar, className: "md:hidden text-gray-500 hover:text-gray-700", children: _jsx(MenuIcon, { className: "h-5 w-5" }) }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setOpen(true), children: _jsx(BellIcon, { className: "h-5 w-5" }) }), _jsx(NotificationsPane, { open: open, onOpenChange: setOpen })] })] }));
}
