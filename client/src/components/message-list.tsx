import { useEffect, useRef } from 'react';

export interface MessageItem {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
}

interface MessageListProps {
  messages: MessageItem[];
  myId: number;
}

export function MessageList({ messages, myId }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log('Displaying messages', messages);
  }, [messages]);

  if (messages.length === 0) {
    return <p className="text-gray-500 text-sm">No messages</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`max-w-[80%] rounded-lg px-4 py-2 text-sm break-words ${
            m.senderId === myId ? 'ml-auto bg-primary-600 text-white' : 'mr-auto bg-gray-100'
          }`}
        >
          {m.content}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
