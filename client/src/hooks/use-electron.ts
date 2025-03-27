import { useEffect, useState } from 'react';
import { ElectronAPI } from '../lib/electron-types';

/**
 * Hook to detect and interact with Electron API
 */
export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    // Check if we're running in Electron
    const electronExists = !!window.electron;
    setIsElectron(electronExists);
    
    // Get app version if in Electron
    if (electronExists) {
      window.electron?.app.getVersion()
        .then(ver => setVersion(ver))
        .catch(err => console.error('Error getting app version:', err));
      
      // Set up online/offline status listener
      window.electron?.system.isOnline()
        .then(status => setIsOnline(status))
        .catch(err => console.error('Error getting online status:', err));
      
      // Listen for online/offline events
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);
  
  // Provide safe access to the Electron API
  const getElectronAPI = (): ElectronAPI | null => {
    return window.electron || null;
  };
  
  return {
    isElectron,
    version,
    isOnline,
    api: getElectronAPI()
  };
}