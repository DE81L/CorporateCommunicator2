import { createContext, useContext, useState, ReactNode } from 'react';

export interface ChatUser {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  isonline?: number | boolean;
}

interface ChatContextType {
  chatUser: ChatUser | null;
  setChatUser: (user: ChatUser | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  return (
    <ChatContext.Provider value={{ chatUser, setChatUser }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return ctx;
}
