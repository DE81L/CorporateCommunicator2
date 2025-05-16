import { useEffect } from 'react';
import { useAuth } from './use-auth';
import { apiClient } from '@/lib/api-client';

export function useUserStatusHeartbeat() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const patchOnline = () =>
      apiClient.request('/users/status', {
        method     : 'PATCH',
        credentials: 'include',
        headers    : { 'Content-Type': 'application/json' },
        body       : JSON.stringify({ isonline: 1 }),
      }).catch(console.error);

    patchOnline();
    const interval = setInterval(patchOnline, 10_000);

    const setOffline = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_API_URL}/users/status`,
        JSON.stringify({ isonline: 0 }),
      );
    };
    window.addEventListener('beforeunload', setOffline);

    return () => {
      clearInterval(interval);
      setOffline();
      window.removeEventListener('beforeunload', setOffline);
    };
  }, [user]);
}
