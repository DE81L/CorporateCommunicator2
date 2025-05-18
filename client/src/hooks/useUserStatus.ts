// client/src/hooks/useUserStatus.ts
import { useEffect } from 'react';
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
      .catch(console.error);

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
        .catch(console.error);
    }, 10_000);

    const setOffline = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_API_URL}/api/users/status`,
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