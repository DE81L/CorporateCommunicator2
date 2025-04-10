import { useState, useEffect } from 'react';
import type { ElectronAPI } from '../lib/electron-types';

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [api, setApi] = useState<ElectronAPI>({} as ElectronAPI);
  
  useEffect(() => {
    console.log("useElectron: useEffect - api changed", api);
    
    // Safely check and set Electron environment
    const electronApi = (window.electron ?? null) as unknown as ElectronAPI;
    setIsElectron(!!electronApi);
    setApi(electronApi);

    if (electronApi) {
      // Get app version
      electronApi.app.getVersion()
        .then(ver => setVersion(ver))
        .catch(err => console.error('Error getting app version:', err));

      // Set up online/offline status
      electronApi.system.isOnline()
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


  return {
    isElectron,
    version,
    isOnline,
    api
  };
}
