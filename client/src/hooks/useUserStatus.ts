// client/src/hooks/useUserStatus.ts
import { useEffect } from 'react';
import { showError } from '@/lib/error-toast';
import { useAuth } from './use-auth';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

export function useUserStatusHeartbeat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    // сразу помечаем online
    apiClient
      .request('/users/status', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isonline: 1 }),
      })
      .then(() => {
        queryClient.setQueryData(['/api/user'], (prev: any) =>
          prev ? { ...prev, isOnline: 1 } : prev
        );
      })
      .catch(showError);

    const interval = setInterval(() => {
      apiClient
        .request('/users/status', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isonline: 1 }),
        })
        .then(() => {
          queryClient.setQueryData(['/api/user'], (prev: any) =>
            prev ? { ...prev, isOnline: 1 } : prev
          );
        })
        .catch(showError);
    }, 10_000);

    const setOffline = () => {
      const envBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const base = envBase.endsWith('/api')
        ? envBase
        : `${envBase.replace(/\/+$/, '')}/api`;
      navigator.sendBeacon(
        `${base}/users/status`,
        JSON.stringify({ isonline: 0 })
      );
      queryClient.setQueryData(['/api/user'], (prev: any) =>
        prev ? { ...prev, isOnline: 0 } : prev
      );
    };
    window.addEventListener('beforeunload', setOffline);

    return () => {
      clearInterval(interval);
      setOffline();
      window.removeEventListener('beforeunload', setOffline);
    };
  }, [user, queryClient]);
}