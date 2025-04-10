import { useState, useEffect } from "react";
import { useElectron } from "@/hooks/use-electron";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/lib/useWebSocket";
import {
  Cpu, 
  Database,
  HardDrive,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { TranslationKey } from "@/lib/i18n/translations";

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  memory: {
    total: number;
    free: number;
  };
}

export default function ElectronInfo() {
  const { isElectron, api } = useElectron();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { connectionStatus } = useWebSocket();
  const { t } = useTranslation();

  useEffect(() => {
    if (isElectron && api) {
      fetchSystemInfo();
      fetchAppVersion();
      checkOnlineStatus();

      // Set up a timer to check online status periodically
      const interval = setInterval(checkOnlineStatus, 30000);

      return () => clearInterval(interval);
    }
  }, [isElectron, api]);

  const fetchSystemInfo = async () => {
    if (!api?.system) return;

    setIsLoading(true);
    try {
      const info = await api.system.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error("Failed to fetch system info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppVersion = async () => {
    if (!api?.app) return;

    try {
      const version = await api.app.getVersion();
      setAppVersion(version);
    } catch (error) {
      console.error("Failed to fetch app version:", error);
    }
  };

  const checkOnlineStatus = async () => {
    if (!api?.system) return;

    try {
      const online = await api.system.isOnline();
      setIsOnline(online);
    } catch (error) {
      console.error("Failed to check online status:", error);
      setIsOnline(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isElectron) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <CardTitle className="text-base font-medium">
          {t("profile.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-yellow-500" />
            )}
            <span className="font-medium">
              {t("profile.status")}:
            </span> 
          </div>
          <Badge
            variant={
              connectionStatus === "open"
                ? "default"
                : connectionStatus === "offline"
                  ? "secondary"
                  : "destructive"
            }
          >
            {connectionStatus === "offline"
              ? t("profile.status")
              : connectionStatus === "open"
                ? t("profile.online")
                : connectionStatus === "connecting"
                  ? t("nav.home")
                  : connectionStatus === "closing" ||
                    connectionStatus === "closed"
                    ? t("common.refresh") : t("common.refresh")}
          </Badge>
        </div>

        {appVersion && (
          <div className="flex items-center justify-between">
            <span className="font-medium">App Version:</span>
            <span>{appVersion}</span>
          </div>
        )}

        {systemInfo && (
          <>
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-gray-500" />
              <span className="font-medium">
                {t("common.appName")}
              </span>
            </div>

            <div className="pl-6 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{t("system_info.platform")}:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded" >
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

            <div className="flex items-center space-x-2" >
              <HardDrive className="h-4 w-4 text-gray-500" />                
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
                  {formatBytes(
                    systemInfo.memory.total - systemInfo.memory.free,
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-gray-500" />
              <span className="font-medium">
                {t("system_info.local_storage")}
              </span>
            </div>

            <div className="pl-6 space-y-2 text-sm">
              <div className="flex items-center justify-between" >
                <span>{t("system_info.connection_status")}:</span>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full"
          onClick={fetchSystemInfo}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {t("common.refresh")}
        </Button>
      </CardContent>
    </Card>
  );
}
