import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MessageStatusDot from './message-status-dot';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import UserHoverCard from '@/components/user-hover-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface MessageItem {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
  file?: string;
  synced?: boolean;
  transport?: 'server' | 'p2p';
  status?: 'pending' | 'delivered' | 'read' | 'p2p';
  error?: boolean;
}

interface MessageListProps {
  messages: MessageItem[];
  myId: number;
  groupMode?: boolean;
  users?: Record<number, { firstName: string; lastName: string; avatarUrl?: string | null }>;
}

export function MessageList({ messages, myId, groupMode = false, users = {} }: MessageListProps) {
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesRef = useRef<string | null>(null);
  const firstRenderRef = useRef(true);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  useEffect(() => {
    const container = endRef.current?.parentElement;
    if (!container) return;
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 10;
    const behavior = firstRenderRef.current ? 'auto' : 'smooth';
    if (nearBottom || firstRenderRef.current) {
      endRef.current?.scrollIntoView({ behavior });
    }
    if (firstRenderRef.current) firstRenderRef.current = false;
  }, [messages]);

  useEffect(() => {
    const serialized = JSON.stringify(messages);
    if (prevMessagesRef.current !== serialized) {
      console.log('Displaying messages', messages);
      prevMessagesRef.current = serialized;
    }
  }, [messages]);

  const filtered = messages.filter((m) => m.content.trim() !== '' || !!m.file);

  if (filtered.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">{t('messages.noMessages')}</p>;
  }

  const isImage = (file: string) =>
    file.startsWith('data:image') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(file);

  const FileIcon = ({ ext }: { ext: string }) => {
    ext = ext.toLowerCase();
    const common = 'h-6 w-6';
    switch (ext) {
      case 'pdf':
        return <span className={common}>📄</span>;
      case 'zip':
      case 'rar':
        return <span className={common}>🗜️</span>;
      case 'mp3':
      case 'wav':
        return <span className={common}>🎵</span>;
      case 'mp4':
      case 'mov':
        return <span className={common}>🎬</span>;
      default:
        return <span className={common}>{ext.slice(0, 3).toUpperCase()}</span>;
    }
  };

  const getInitials = (f: string, l: string) => `${f[0] || ''}${l[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-full flex flex-col space-y-3">
      {filtered.map((m) => (
        <div
          key={m.id}
          className={`max-w-[80%] rounded-xl px-4 py-2 text-sm break-words space-y-2 ${
            m.senderId === myId
              ? 'ml-auto bg-primary-100 text-primary-900 dark:bg-primary-700 dark:text-white'
              : 'mr-auto bg-gray-200 text-black dark:bg-gray-700 dark:text-white'
          }`}
        >
          {groupMode && (
            <UserHoverCard
              user={{
                firstName: users[m.senderId]?.firstName || '',
                lastName: users[m.senderId]?.lastName || '',
                avatarUrl: users[m.senderId]?.avatarUrl,
              }}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  {users[m.senderId]?.avatarUrl ? (
                    <img
                      src={users[m.senderId]!.avatarUrl!}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback>
                      {getInitials(
                        users[m.senderId]?.firstName || '',
                        users[m.senderId]?.lastName || '',
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-xs font-medium">
                  {users[m.senderId]?.firstName} {users[m.senderId]?.lastName}
                </span>
              </div>
            </UserHoverCard>
          )}
          <div className="whitespace-pre-wrap leading-tight emoji-text">
            {(() => {
              const match = m.content.match(/\[([^\]]+)\]\((https?:[^)]+)\)$/);
              if (match) {
                return (
                  <>
                    {m.content.replace(match[0], '').trim()}
                    <div className="mt-2">
                      <a
                        href={match[2]}
                        target="_blank"
                        className="px-2 py-1 bg-primary text-white rounded text-xs"
                      >
                        {match[1]}
                      </a>
                    </div>
                  </>
                );
              }
              return m.content;
            })()}
          </div>
          {m.file && (
            isImage(m.file) ? (
              <img
                src={m.file}
                alt="attachment"
                className="max-w-xs rounded-md cursor-pointer"
                onClick={() => setViewerSrc(m.file!)}
              />
            ) : (
              <a
                href={m.file}
                download
                className="underline text-blue-600 dark:text-blue-400 flex items-center gap-1"
              >
                <FileIcon ext={(m.file.split('.').pop() || '').split('?')[0]} />
                {t('messages.downloadFile')}
              </a>
            )
          )}
          <div className="flex justify-end">
            <MessageStatusDot
              status={m.status}
              transport={m.transport}
              synced={m.synced}
              error={m.error}
            />
          </div>
        </div>
      ))}
      <div ref={endRef} />
      {viewerSrc && (
        <Dialog open={true} onOpenChange={() => setViewerSrc(null)}>
          <DialogContent className="p-0 bg-transparent border-none max-w-fit">
            <DialogHeader className="sr-only">
              <DialogTitle>{t('messages.imagePreview')}</DialogTitle>
              <DialogDescription>{t('messages.imagePreviewDescription')}</DialogDescription>
            </DialogHeader>
            <img
              src={viewerSrc}
              alt="preview"
              className="max-w-screen max-h-screen object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
