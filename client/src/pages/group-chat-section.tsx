import { FormEvent, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { createApiClient } from '@/lib/api-client';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { MessageList, MessageItem } from '@/components/message-list';
import { showError } from '@/lib/error-toast';

interface Group {
  id: number;
  name: string;
}

interface GroupMessage extends MessageItem {
  groupId: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface Props {
  group: Group;
}

export default function GroupChatSection({ group }: Props) {
  const { user } = useAuth();
  const apiClient = createApiClient();
  const { t } = useTranslation();
  const { lastRawMessage } = useWebSocket();
  const [msgInput, setMsgInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { data: messages = [], refetch } = useQuery<GroupMessage[]>({
    queryKey: ['group-messages', group.id],
    queryFn: async () =>
      (await apiClient.request<GroupMessage[]>(`/api/groups/${group.id}/messages`)) ?? [],
  });

  useEffect(() => {
    if (lastRawMessage && (lastRawMessage as any).type === 'chat') {
      const payload = (lastRawMessage as any).payload as GroupMessage;
      if (payload.groupId === group.id) {
        refetch();
      }
    }
  }, [lastRawMessage, group.id, refetch]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    try {
      await apiClient.request(`/api/groups/${group.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msgInput }),
      });
      setMsgInput('');
      refetch();
    } catch (err) {
      showError(err, 'Failed to send message');
    }
  };

  const usersMap = messages.reduce<Record<number, { firstName: string; lastName: string; avatarUrl?: string | null }>>(
    (acc, m) => {
      acc[m.senderId] = { firstName: m.firstName, lastName: m.lastName, avatarUrl: m.avatarUrl };
      return acc;
    },
    {},
  );

  if (!user) return null;

  const ordered = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const plainMessages: MessageItem[] = ordered.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    content: m.content,
    timestamp: m.timestamp,
    status: m.status,
    file: m.file,
  }));

  return (
    <div className="flex flex-col h-full">
      <header className="p-3 border-b border-border font-medium">{group.name}</header>
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={plainMessages} myId={user.id} groupMode users={usersMap} />
      </div>
      <form onSubmit={sendMessage} className="border-t border-border p-3 flex gap-3">
        <Textarea
          ref={textareaRef}
          className="flex-1 resize-none"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
        />
        <Button type="submit" disabled={!msgInput.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
