import { useState, useEffect } from 'react';
import type { ElectronAPI } from '../lib/electron-types';

const defaultElectronData = {
  isElectron: false,
  version: null,
  isOnline: navigator.onLine,
  api: null,
};

export function useElectron() {
  const [data, setData] = useState<{ isElectron: boolean; version: string | null; isOnline: boolean; api: ElectronAPI | null }>(defaultElectronData);
  const { isElectron, version, isOnline, api } = data
  
  useEffect(() => {
    console.log("useElectron: useEffect - api changed", api);
    
    // Safely check and set Electron environment
    const electronApi = (window.electron ?? null) as unknown as ElectronAPI;
        setData(prev => ({ ...prev, isElectron: !!electronApi, api: electronApi }));


        if (electronApi) {
      // Get app version
      electronApi.app.getVersion()
        .then(ver => setData(prev => ({...prev, version: ver})))
        .catch(err => console.error('Error getting app version:', err));

      // Set up online/offline status
      electronApi.system.isOnline()
        .then(status => setData(prev => ({
          ...prev, isOnline: status,
        })))
        .catch(err => console.error('Error getting online status:', err));

      // Listen for online/offline events
      const handleOnline = () => setData(prev => ({ ...prev, isOnline: true }));;
      const handleOffline = () => setData(prev => ({ ...prev, isOnline: false }));;

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
