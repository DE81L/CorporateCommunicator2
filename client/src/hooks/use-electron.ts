import { useEffect, useState } from "react";
import { ElectronAPI } from "../lib/electron-types";

// Environment detection constants
const IS_REPLIT = typeof process !== 'undefined' && 
                 (!!process.env.REPL_ID || 
                  !!import.meta.env.VITE_REPLIT || 
                  !!import.meta.env.VITE_WEB_ONLY);
                  
const FORCE_WEB = import.meta.env.ELECTRON === false || 
                 import.meta.env.VITE_WEB_ONLY === 'true';

/**
 * Enhanced hook to detect and interact with Electron API
 * Handles both Electron and web (Replit) environments gracefully
 */
export function useElectron() {
  // Default to web environment for safety
  const [isElectron, setIsElectron] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    // Comprehensive environment check
    const electronAvailable = !!window.electron && !FORCE_WEB;
    setIsElectron(electronAvailable);

    // Initialize only if in Electron environment
    if (electronAvailable && window.electron) {
      // Get app version
      window.electron.app
        .getVersion()
        .then((ver) => setVersion(ver))
        .catch((err) => console.error("Error getting app version:", err));

      // Get online status
      window.electron.system
        .isOnline()
        .then((status) => setIsOnline(status))
        .catch((err) => console.error("Error getting online status:", err));

      // Get system info if available
      if (window.electron.system && window.electron.system.getSystemInfo) {
        window.electron.system
          .getSystemInfo()
          .then((info) => setSystemInfo(info))
          .catch((err) => console.error("Error getting system info:", err));
      }
    } else {
      // Web environment fallbacks
      setVersion('web-version');
      
      // Simulate system info for web environment
      setSystemInfo({
        platform: 'web',
        arch: navigator.platform || 'unknown',
        version: navigator.userAgent || 'unknown',
        memory: {
          total: 0,
          free: 0
        }
      });
    }

    // These event listeners work in both environments
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Safe Electron API access with web fallbacks
  const getElectronAPI = (): ElectronAPI | null => {
    if (isElectron && window.electron) {
      return window.electron;
    }
    return null;
  };

  /**
   * Safely calls an Electron API method with fallback for web
   * @param method The method path like 'app.getPath'
   * @param args Arguments to pass to the method
   * @param fallback Fallback value or function for web environment
   */
  const safeElectronCall = async (method: string, args: any[] = [], fallback: any = null) => {
    if (!isElectron) {
      return typeof fallback === 'function' ? fallback() : fallback;
    }
    
    const api = getElectronAPI();
    if (!api) return fallback;
    
    // Navigate to the method following the path
    const parts = method.split('.');
    let current: any = api;
    
    for (const part of parts) {
      if (!current[part]) return fallback;
      current = current[part];
    }
    
    if (typeof current !== 'function') return current;
    
    try {
      return await current(...args);
    } catch (error) {
      console.error(`Error calling ${method}:`, error);
      return fallback;
    }
  };

  return {
    isElectron,
    version,
    isOnline,
    systemInfo,
    api: getElectronAPI(),
    safeElectronCall,
    isReplit: IS_REPLIT || FORCE_WEB,
  };
}
