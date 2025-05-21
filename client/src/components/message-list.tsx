import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MessageStatusDot from './message-status-dot';
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
}

export function MessageList({ messages, myId }: MessageListProps) {
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesRef = useRef<string | null>(null);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const serialized = JSON.stringify(messages);
    if (prevMessagesRef.current !== serialized) {
      console.log('Displaying messages', messages);
      prevMessagesRef.current = serialized;
    }
  }, [messages]);

  if (messages.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">{t('messages.noMessages')}</p>;
  }

  const isImage = (file: string) =>
    file.startsWith('data:image') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(file);

  return (
    <div className="min-h-full flex flex-col space-y-3">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`max-w-[80%] rounded-xl px-4 py-2 text-sm break-words space-y-2 ${
            m.senderId === myId
              ? 'ml-auto bg-primary-100 text-primary-900 dark:bg-primary-700 dark:text-white'
              : 'mr-auto bg-gray-200 text-black dark:bg-gray-700 dark:text-white'
          }`}
        >
          <div>{m.content}</div>
          {m.file && (
            isImage(m.file) ? (
              <img
                src={m.file}
                alt="attachment"
                className="max-w-xs rounded-md cursor-pointer"
                onClick={() => setViewerSrc(m.file!)}
              />
            ) : (
              <a href={m.file} download className="underline text-blue-600 dark:text-blue-400">
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
