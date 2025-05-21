import { useEffect, useRef } from 'react';
import MessageStatusDot from './message-status-dot';

export interface MessageItem {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
  file?: string;
  synced?: boolean;
  transport?: 'server' | 'p2p';
  status?: 'pending' | 'delivered' | 'read';
  error?: boolean;
}

interface MessageListProps {
  messages: MessageItem[];
  myId: number;
}

export function MessageList({ messages, myId }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesRef = useRef<string | null>(null);

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
    return <p className="text-gray-500 dark:text-gray-400 text-sm">No messages</p>;
  }

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
            m.file.startsWith('data:image') ? (
              <img src={m.file} alt="attachment" className="max-w-xs rounded-md" />
            ) : (
              <a href={m.file} download className="underline text-blue-600 dark:text-blue-400">
                Download file
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
    </div>
  );
}
