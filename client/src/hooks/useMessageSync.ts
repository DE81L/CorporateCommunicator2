import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createApiClient } from '@/lib/api-client';
import {
  getUnsyncedMessages,
  markMessagesSynced,
  appendMessage,
  StoredMessage,
} from '@/lib/message-storage';

export function useMessageSync() {
  const { user } = useAuth();
  const apiClient = createApiClient();

  useEffect(() => {
    if (!user) return;

    const sync = async () => {
      const unsynced = getUnsyncedMessages(user.id);
      for (const { otherId, messages } of unsynced) {
        if (messages.length === 0) continue;
        try {
          await apiClient.request('/sync/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
          });
          markMessagesSynced(user.id, otherId, messages.map((m) => m.id));
        } catch (err) {
          console.error('Message sync failed', err);
        }
      }

      try {
        const incoming = await apiClient.request<StoredMessage[]>('/sync/messages');
        if (incoming) {
          for (const msg of incoming) {
            appendMessage(msg.senderId, msg.receiverId, { ...msg, synced: true });
          }
        }
      } catch (err) {
        console.error('Fetch sync messages failed', err);
      }
    };

    sync();
    const interval = setInterval(sync, 30_000);
    return () => clearInterval(interval);
  }, [user]);
}
