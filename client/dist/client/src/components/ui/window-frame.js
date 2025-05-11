import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { X, Minimize, Maximize, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useElectron } from '@/hooks/use-electron';
import { useAuth } from '@/hooks/use-auth';
export const WindowFrame = () => {
    const { api, isElectron } = useElectron();
    const { logout } = useAuth();
    const handleMinimize = () => api?.app?.minimize?.() ?? window.scrollTo({ top: 0, behavior: 'smooth' });
    const handleMaximize = () => api?.app?.maximize?.() ?? window.open(window.location.href, '_blank');
    const handleClose = () => api?.app?.quit?.() ?? window.close();
    const handleRefresh = () => window.location.reload();
    const handleLogout = () => logout();
    return (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: handleRefresh, children: _jsx(RefreshCw, { className: "h-4 w-4" }) }), isElectron && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: handleMinimize, children: _jsx(Minimize, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: handleMaximize, children: _jsx(Maximize, { className: "h-4 w-4" }) })] })), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: handleLogout, children: _jsx(LogOut, { className: "h-4 w-4" }) }), isElectron && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 hover:bg-red-500 hover:text-white", onClick: handleClose, children: _jsx(X, { className: "h-4 w-4" }) }))] }));
};
export const WindowFrameHeader = ({ title = 'Корпоративный Мессенджер' }) => (_jsxs("div", { className: "fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur h-9 flex items-center justify-between px-4 select-none", children: [_jsx("span", { className: "text-sm font-medium truncate", children: title }), _jsx(WindowFrame, {})] }));
