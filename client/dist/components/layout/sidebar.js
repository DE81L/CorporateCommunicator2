import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from "@/hooks/use-auth"; // Import useAuth
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { MessageSquareIcon, ClipboardCheckIcon, ContactIcon, SettingsIcon, XIcon, WifiIcon, WifiOffIcon, BookOpenIcon, LogOutIcon, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem, } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
export default function Sidebar({ activeSection, setActiveSection, isOpen, setIsOpen, connectionStatus, }) {
    const { user, logout } = useAuth(); // Use useAuth here
    const { t } = useTranslation();
    const [, setLocation] = useLocation();
    const handleLogout = async () => {
        await logout();
        setLocation("/auth");
    };
    if (!user)
        return null;
    const handleNavItemClick = (id) => {
        setActiveSection(id);
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };
    const navItems = [
        { id: "messages", icon: MessageSquareIcon, label: t("sidebar.nav.messages") },
        { id: "requests", icon: ClipboardCheckIcon, label: t("sidebar.nav.requests"), badge: 2 },
        { id: "contacts", icon: ContactIcon, label: t("sidebar.nav.contacts") },
        { id: "wiki", icon: BookOpenIcon, label: t("sidebar.nav.wiki") || "Wiki" },
    ];
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: cn("fixed inset-0 bg-black/30 z-20 md:hidden transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 pointer-events-none"), onClick: () => setIsOpen(false) }), _jsxs("aside", { className: cn("w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-200 ease-in-out", "fixed left-0 top-0 bottom-0 md:relative md:translate-x-0", isOpen ? "translate-x-0" : "-translate-x-full"), children: [_jsxs("div", { className: "flex items-center justify-between p-4 md:hidden", children: [_jsx("h2", { className: "text-xl font-semibold text-primary-600", children: "Nexus" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setIsOpen(false), children: _jsx(XIcon, { className: "h-5 w-5" }) })] }), _jsx("div", { className: "px-4 py-2 flex items-center text-xs border-b border-gray-100", children: connectionStatus === "online" ? (_jsxs("div", { className: "flex items-center text-green-600", children: [_jsx(WifiIcon, { className: "h-3 w-3 mr-1" }), _jsx("span", { children: "Connected" })] })) : connectionStatus === "offline" ? (_jsxs("div", { className: "flex items-center text-blue-600", children: [_jsx(WifiOffIcon, { className: "h-3 w-3 mr-1" }), _jsx("span", { children: "Offline Mode" })] })) : connectionStatus === "connecting" ? (_jsxs("div", { className: "flex items-center text-yellow-600", children: [_jsx(WifiIcon, { className: "h-3 w-3 mr-1 animate-pulse" }), _jsx("span", { children: "Connecting..." })] })) : (_jsxs("div", { className: "flex items-center text-red-600", children: [_jsx(WifiOffIcon, { className: "h-3 w-3 mr-1" }), _jsx("span", { children: "Disconnected" })] })) }), _jsx("nav", { className: "p-4 space-y-1", children: navItems.map((item) => (_jsxs(Button, { variant: "ghost", className: cn("w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900", activeSection === item.id &&
                                "bg-primary-50 text-primary-600 hover:bg-primary-50 hover:text-primary-600"), onClick: () => handleNavItemClick(item.id), children: [_jsx(item.icon, { className: "mr-3 h-5 w-5" }), _jsx("span", { children: item.label }), item.badge ? (_jsx(Badge, { className: "ml-auto", variant: "destructive", children: item.badge })) : null] }, item.id))) }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", className: "flex w-full items-center justify-start gap-3", children: [_jsx(Avatar, { children: _jsx(AvatarFallback, { children: (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "") }) }), _jsxs("div", { className: "flex-1 ", children: [_jsxs("p", { className: "text-sm font-medium", children: [user.firstName, " ", user.lastName] }), _jsx("p", { className: "text-xs text-gray-500 truncate", children: user.email })] })] }) }), _jsxs(DropdownMenuContent, { className: "w-56 bg-white border", align: "start", children: [_jsxs(DropdownMenuLabel, { className: "font-normal text-sm", children: [_jsxs("p", { className: "text-sm font-medium", children: [user.firstName, " ", user.lastName] }), _jsx("p", { className: "text-xs text-gray-500 truncate", children: user.email })] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => setLocation("/settings"), children: [_jsx(SettingsIcon, { className: "mr-2 h-4 w-4" }), t("sidebar.nav.settings")] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: handleLogout, className: "text-destructive focus:text-destructive", children: [_jsx(LogOutIcon, { className: "mr-2 h-4 w-4" }), t("auth.logout")] })] })] }) })] })] }));
}
