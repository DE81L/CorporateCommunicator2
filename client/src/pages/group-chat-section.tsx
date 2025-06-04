import { FormEvent, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { createApiClient } from '@/lib/api-client';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Plus, Smile, X } from 'lucide-react';
import EmojiPicker from '@/components/emoji-picker';
import { cn } from '@/lib/utils';
import { MessageList, MessageItem } from '@/components/message-list';
import { showError } from '@/lib/error-toast';

interface Group {
  id: number;
  name: string;
  creatorId?: number;
  isAnnouncement?: boolean;
  isExplanation?: boolean;
}

interface GroupMessage extends MessageItem {
  groupId: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface Props {
  group: Group;
  readOnly?: boolean;
}

export default function GroupChatSection({ group, readOnly }: Props) {
  const { user } = useAuth();
  const apiClient = createApiClient();
  const { t } = useTranslation();
  const { lastRawMessage } = useWebSocket();
  const [msgInput, setMsgInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [files, setFiles] = useState<{ name: string; data: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const isReadOnly = readOnly ?? (group.isExplanation && !user?.isAdmin && user?.id !== group.creatorId);

  const messagesEndpoint = group.isAnnouncement
    ? `/api/announcements/${group.id}/messages`
    : `/api/groups/${group.id}/messages`;
  const { data: messages = [], refetch } = useQuery<GroupMessage[]>({
    queryKey: [group.isAnnouncement ? 'announcement-messages' : 'group-messages', group.id],
    queryFn: async () =>
      (await apiClient.request<GroupMessage[]>(messagesEndpoint)) ?? [],
  });

  useEffect(() => {
    if (lastRawMessage && (lastRawMessage as any).type === 'chat') {
      const payload = (lastRawMessage as any).payload as GroupMessage;
      if (payload.groupId === group.id) {
        refetch();
      }
    }
  }, [lastRawMessage, group.id, refetch]);

  const sendSingle = async (content: string, file?: string) => {
    await apiClient.request(`/api/groups/${group.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, file }),
    });
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() && files.length === 0) return;
    try {
      await sendSingle(msgInput, files[0]?.data);
      for (let i = 1; i < files.length; i++) {
        await sendSingle('', files[i].data);
      }
      setMsgInput('');
      setFiles([]);
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

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMsgInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const max = 96;
      const newHeight = Math.min(textareaRef.current.scrollHeight, max);
      textareaRef.current.style.height = `${newHeight}px`;
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  };

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
      {!isReadOnly && (
      <form
        onSubmit={sendMessage}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const dropped = Array.from(e.dataTransfer.files || []);
          dropped.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () =>
              setFiles((f) => [...f, { name: file.name, data: reader.result as string }]);
            reader.readAsDataURL(file);
          });
        }}
        className={cn('border-t border-border p-3 flex flex-col gap-2', dragOver && 'border-blue-500')}
      >
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, idx) => {
              const isImg = f.data.startsWith('data:image');
              const ext = f.name.split('.').pop() || '';
              return (
                <div key={idx} className="relative">
                  {isImg ? (
                    <img src={f.data} alt="" className="h-16 w-16 object-cover rounded" />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center bg-muted rounded text-xs">
                      {ext.toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setFiles((fs) => fs.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 bg-background rounded-full border border-border"
                  >
                    <span className="sr-only">{t('messages.removeFile')}</span>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-3 items-end">
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Plus className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowPicker((s) => !s)}>
              <Smile className="h-5 w-5" />
            </Button>
            {showPicker && (
              <EmojiPicker onSelect={(e) => setMsgInput((m) => m + e)} onClose={() => setShowPicker(false)} />
            )}
          </div>
          <Textarea
            ref={textareaRef}
            className="flex-1 resize-none max-h-24 overflow-y-auto"
            value={msgInput}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                void sendMessage(e as unknown as FormEvent);
              }
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              if (selected.length === 0) return;
              selected.forEach((file) => {
                const reader = new FileReader();
                reader.onload = () =>
                  setFiles((f) => [...f, { name: file.name, data: reader.result as string }]);
                reader.readAsDataURL(file);
              });
              e.target.value = '';
            }}
          />
        <Button type="submit" disabled={!msgInput.trim() && files.length === 0}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
      </form>
      )}
    </div>
  );
}
