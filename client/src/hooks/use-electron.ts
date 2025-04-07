import { useEffect, useState } from "react";
import { ElectronAPI } from "../lib/electron-types";

/**
 * Hook to detect and interact with Electron API
 * Modified to work better in Replit environment
 */
export function useElectron() {
  // In Replit, we always want to return false for isElectron
  const [isElectron, setIsElectron] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if window.electron exists and if we're not explicitly set to non-Electron mode
    const electronExists = !!window.electron && import.meta.env.ELECTRON !== false;
    setIsElectron(electronExists);

    // Get app version if in Electron
    if (electronExists && window.electron) {
      window.electron.app
        .getVersion()
        .then((ver) => setVersion(ver))
        .catch((err) => console.error("Error getting app version:", err));

      // Set up online/offline status listener
      window.electron.system
        .isOnline()
        .then((status) => setIsOnline(status))
        .catch((err) => console.error("Error getting online status:", err));
    }

    // Listen for online/offline events (works in both Electron and browser)
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Provide safe access to the Electron API
  const getElectronAPI = (): ElectronAPI | null => {
    return window.electron || null;
  };

  return {
    isElectron,
    version,
    isOnline,
    api: getElectronAPI(),
  };
}
