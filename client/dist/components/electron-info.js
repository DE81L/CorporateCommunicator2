import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useElectron } from "@/hooks/use-electron";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Cpu, Database, HardDrive, RefreshCw, Wifi, WifiOff, } from "lucide-react";
import { useTranslation } from "react-i18next";
export default function ElectronInfo({ compact = false }) {
    const { isElectron, api } = useElectron();
    const [systemInfo, setSystemInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [appVersion, setAppVersion] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const { connectionStatus } = useWebSocket();
    const { t } = useTranslation();
    useEffect(() => {
        if (isElectron && api) {
            fetchSystemInfo();
            fetchAppVersion();
            checkOnlineStatus();
            const interval = setInterval(checkOnlineStatus, 30000);
            return () => clearInterval(interval);
        }
    }, [isElectron, api]);
    const fetchSystemInfo = async () => {
        if (!api?.system)
            return;
        setIsLoading(true);
        try {
            const info = await api.system.getSystemInfo();
            setSystemInfo(info);
        }
        catch (error) {
            console.error("Failed to fetch system info:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const fetchAppVersion = async () => {
        if (!api?.app)
            return;
        try {
            const version = (await api.app.getVersion());
            setAppVersion(version);
        }
        catch (error) {
            console.error("Failed to fetch app version:", error);
        }
    };
    const checkOnlineStatus = async () => {
        if (!api?.system)
            return;
        try {
            const online = await api.system.isOnline();
            setIsOnline(online);
        }
        catch (error) {
            console.error("Failed to check online status:", error);
            setIsOnline(false);
        }
    };
    const formatBytes = (bytes) => {
        if (bytes === 0)
            return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };
    if (!isElectron) {
        return null;
    }
    return (_jsxs(Card, { children: [!compact && (_jsx(CardHeader, { className: "bg-gray-50 border-b border-gray-200 px-4 py-3", children: _jsx(CardTitle, { className: "text-base font-medium", children: t("profile.title") }) })), _jsxs(CardContent, { className: "space-y-4 py-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [isOnline ? (_jsx(Wifi, { className: "h-4 w-4 text-green-500" })) : (_jsx(WifiOff, { className: "h-4 w-4 text-yellow-500" })), _jsxs("span", { className: "font-medium", children: [t("profile.status"), ":"] })] }), _jsx(Badge, { variant: connectionStatus === "open"
                                    ? "default"
                                    : connectionStatus === "offline"
                                        ? "secondary"
                                        : "destructive", children: connectionStatus === "offline"
                                    ? t("profile.status")
                                    : connectionStatus === "open"
                                        ? t("profile.online")
                                        : connectionStatus === "connecting"
                                            ? t("nav.home")
                                            : connectionStatus === "closing" ||
                                                connectionStatus === "closed"
                                                ? t("common.refresh") : t("common.refresh") })] }), appVersion && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-medium", children: "App Version:" }), _jsx("span", { children: appVersion })] })), systemInfo && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Cpu, { className: "h-4 w-4 text-gray-500" }), _jsx("span", { className: "font-medium", children: t("common.appName") })] }), _jsxs("div", { className: "pl-6 space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { children: [t("system_info.platform"), ":"] }), _jsx("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded", children: systemInfo.platform })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { children: [t("system_info.architecture"), ":"] }), _jsx("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded", children: systemInfo.arch })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { children: [t("system_info.version"), ":"] }), _jsx("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded", children: systemInfo.version })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(HardDrive, { className: "h-4 w-4 text-gray-500" }), _jsx("span", { className: "font-medium", children: t("system_info.total_memory") })] }), _jsxs("div", { className: "pl-6 space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { children: [t("profile.title"), ":"] }), _jsx("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded", children: formatBytes(systemInfo.memory.total) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { children: [t("profile.title"), ":"] }), _jsx("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded", children: formatBytes(systemInfo.memory.free) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { children: [t("profile.title"), ":"] }), _jsx("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded", children: formatBytes(systemInfo.memory.total - systemInfo.memory.free) })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Database, { className: "h-4 w-4 text-gray-500" }), _jsx("span", { className: "font-medium", children: t("system_info.local_storage") })] }), _jsx("div", { className: "pl-6 space-y-2 text-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { children: [t("system_info.connection_status"), ":"] }), _jsx(Badge, { variant: "outline", children: "Active" })] }) })] })), _jsxs(Button, { variant: "outline", size: "sm", className: "mt-4 w-full", onClick: fetchSystemInfo, disabled: isLoading, children: [_jsx(RefreshCw, { className: `h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}` }), t("common.refresh")] })] })] }));
}
