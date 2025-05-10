"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ElectronInfo;
const react_1 = require("react");
const use_electron_1 = require("@/hooks/use-electron");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const useWebSocket_1 = require("@/hooks/useWebSocket");
const lucide_react_1 = require("lucide-react");
const react_i18next_1 = require("react-i18next");
function ElectronInfo({ compact = false }) {
    const { isElectron, api } = (0, use_electron_1.useElectron)();
    const [systemInfo, setSystemInfo] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [appVersion, setAppVersion] = (0, react_1.useState)(null);
    const [isOnline, setIsOnline] = (0, react_1.useState)(true);
    const { connectionStatus } = (0, useWebSocket_1.useWebSocket)();
    const { t } = (0, react_i18next_1.useTranslation)();
    (0, react_1.useEffect)(() => {
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
    return (<card_1.Card>
      {!compact && (<card_1.CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <card_1.CardTitle className="text-base font-medium">
            {t("profile.title")}
          </card_1.CardTitle>
        </card_1.CardHeader>)}
      <card_1.CardContent className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (<lucide_react_1.Wifi className="h-4 w-4 text-green-500"/>) : (<lucide_react_1.WifiOff className="h-4 w-4 text-yellow-500"/>)}
            <span className="font-medium">
              {t("profile.status")}:
            </span> 
          </div>
          <badge_1.Badge variant={connectionStatus === "open"
            ? "default"
            : connectionStatus === "offline"
                ? "secondary"
                : "destructive"}>
            {connectionStatus === "offline"
            ? t("profile.status")
            : connectionStatus === "open"
                ? t("profile.online")
                : connectionStatus === "connecting"
                    ? t("nav.home")
                    : connectionStatus === "closing" ||
                        connectionStatus === "closed"
                        ? t("common.refresh") : t("common.refresh")}
          </badge_1.Badge>
        </div>

        {appVersion && (<div className="flex items-center justify-between">
            <span className="font-medium">App Version:</span>
            <span>{appVersion}</span>
          </div>)}

        {systemInfo && (<>
            <div className="flex items-center space-x-2">
              <lucide_react_1.Cpu className="h-4 w-4 text-gray-500"/>
              <span className="font-medium">
                {t("common.appName")}
              </span>
            </div>

            <div className="pl-6 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{t("system_info.platform")}:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {systemInfo.platform}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>{t("system_info.architecture")}:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {systemInfo.arch}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>{t("system_info.version")}:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {systemInfo.version}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <lucide_react_1.HardDrive className="h-4 w-4 text-gray-500"/>                
              <span className="font-medium">{t("system_info.total_memory")}</span>
            </div>

            <div className="pl-6 space-y-2 text-sm">
              <div className="flex items-center justify-between">                
                <span>{t("profile.title")}:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {formatBytes(systemInfo.memory.total)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>{t("profile.title")}:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {formatBytes(systemInfo.memory.free)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>{t("profile.title")}:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {formatBytes(systemInfo.memory.total - systemInfo.memory.free)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <lucide_react_1.Database className="h-4 w-4 text-gray-500"/>
              <span className="font-medium">
                {t("system_info.local_storage")}
              </span>
            </div>

            <div className="pl-6 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{t("system_info.connection_status")}:</span>
                <badge_1.Badge variant="outline">Active</badge_1.Badge>
              </div>
            </div>
          </>)}

        <button_1.Button variant="outline" size="sm" className="mt-4 w-full" onClick={fetchSystemInfo} disabled={isLoading}>
          <lucide_react_1.RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}/>
          {t("common.refresh")}
        </button_1.Button>
      </card_1.CardContent>
    </card_1.Card>);
}
