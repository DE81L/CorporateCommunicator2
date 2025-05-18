import { FormEvent, useEffect, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/context/ChatContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { createApiClient } from '@/lib/api-client';
import {
  loadMessages,
  saveMessages,
  appendMessage,
  StoredMessage,
} from '@/lib/message-storage';
import {
  Send,
  Loader2,
  Phone,
  Video,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { MessageList } from '@/components/message-list';

/* ──────────────── TYPES ──────────────── */

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  file?: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  isonline: 0 | 1;
}

interface WsPacket<T = any> {
  type: string;
  payload: T;
}

interface Props {
  onStartCall?: (
    type: 'audio' | 'video',
    recipient: { id: number; name: string },
  ) => void;
}

/* ──────────────── COMPONENT ──────────────── */

export default function MessagesSection({ onStartCall }: Props) {
  const { user } = useAuth();
  const apiClient = createApiClient();
  const { t } = useTranslation();
  const { connectionStatus, lastRawMessage, sendRaw } = useWebSocket();

  const { chatUser: selectedUser, setChatUser: setSelectedUser } = useChat();
  const [msgInput, setMsgInput] = useState('');
  const [fileData, setFileData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [incomingSignal, setIncomingSignal] = useState<any>(null);
  const [contactsCollapsed, setContactsCollapsed] = useState(false);
  const [contacts, setContacts] = useState<User[]>([]);

  /* ─────────── contacts ─────────── */
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ['contacts'],
    queryFn: async () =>
      (await apiClient.request<User[]>('/contacts')) ?? [],
  });

  useEffect(() => {
    setContacts(users);
  }, [users]);

  /* ─────────── history ─────────── */
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    refetch: refetchHistory,
  } = useQuery<Message[]>({
    queryKey: ['messages', selectedUser?.id],
    enabled: !!selectedUser,
    queryFn: async () => {
      console.log('Fetching messages for', selectedUser?.id);
      return (
        (await apiClient.request<Message[]>(
          `/messages?chatWith=${selectedUser!.id}`,
        )) ?? []
      );
    },
  });

  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const pageSize = 50;
  const maxDisplay = 250;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const messageWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [selectedUser]);

  useEffect(() => {
    if (user && selectedUser) {
      setLocalMessages(loadMessages(user.id, selectedUser.id));
    }
  }, [user, selectedUser]);

  useEffect(() => {
    if (user && selectedUser && messages.length > 0) {
      setLocalMessages((prev) => {
        const merged = Array.from(
          new Map(
            [...prev, ...messages].map((m) => [m.id, m])
          ).values()
        );
        saveMessages(user.id, selectedUser.id, merged);
        return merged;
      });
    }
  }, [messages, user, selectedUser]);

  /* ─────────── P2P ─────────── */
  const isInitiator =
    selectedUser && user ? user.id < selectedUser.id : false;

  const {
    status: p2pStatus,
    lastMessage: p2pMsg,
    send: sendP2P,
  } = usePeerConnection(
    isInitiator,
    useCallback(
      (signal: any) =>
        sendRaw({
          type: 'p2p-signal',
          payload: { to: selectedUser!.id, signal },
        }),
      [sendRaw, selectedUser]
    ),
    incomingSignal,
    !!selectedUser && selectedUser.isonline === 1,
  );

  /* ───── WS side‑effects ───── */
  useEffect(() => {
    if (!lastRawMessage) return;
    const { type, payload } = lastRawMessage as WsPacket<any>;

    if (type === 'user-status') {
      setContacts((prev) =>
        prev.map((u) =>
          u.id === payload.userId ? { ...u, isonline: payload.isonline } : u
        )
      );
      if (
        selectedUser &&
        payload.userId === selectedUser.id &&
        payload.isonline === 1
      ) {
        // собеседник появился в сети – peer‑hook пересоздастся
      }
    }

    if (type === 'p2p-signal' && payload.from === selectedUser?.id) {
      setIncomingSignal(payload.signal);
    }

    if (
      type === 'chat' &&
      selectedUser &&
      (payload.senderId === selectedUser.id ||
        payload.senderId === user?.id)
    ) {
      refetchHistory();
    }
  }, [lastRawMessage, selectedUser, user, refetchHistory]);

  /* ───── P2P incoming ───── */
  useEffect(() => {
    if (
      p2pMsg &&
      ((p2pMsg.senderId === selectedUser?.id &&
        p2pMsg.receiverId === user?.id) ||
        (p2pMsg.senderId === user?.id &&
          p2pMsg.receiverId === selectedUser?.id))
    ) {
      const stored: StoredMessage = {
        id: Date.now(),
        senderId: p2pMsg.senderId,
        receiverId: p2pMsg.receiverId,
        content: p2pMsg.content,
        timestamp: new Date().toISOString(),
        file: p2pMsg.file,
      };
      appendMessage(user!.id, selectedUser!.id, stored);
      setLocalMessages((prev) => [...prev, stored]);
    }
  }, [p2pMsg, selectedUser, user]);

  /* ───── helpers ───── */
  const getInitials = (f: string, l: string) =>
    `${f[0]}${l[0]}`.toUpperCase();


  // combine server and local messages without duplicates
  const combinedMessages = Array.from(
    new Map(
      [...messages, ...localMessages].map((m) => [m.id, m]),
    ).values(),
  ).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const trimmedMessages = combinedMessages.slice(-maxDisplay);
  const visibleMessages = trimmedMessages.slice(-visibleCount);

  useEffect(() => {
    setVisibleCount((c) => {
      const baseline = Math.min(pageSize, trimmedMessages.length);
      const clamped = Math.min(c, trimmedMessages.length);
      return Math.max(clamped, baseline);
    });
  }, [trimmedMessages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 50) {
      setVisibleCount((c) =>
        Math.min(c + pageSize, Math.min(trimmedMessages.length, maxDisplay)),
      );
    }
  };





  /* ───── send ───── */
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() && !fileData) return;
    if (!selectedUser) return;

    console.log('Sending message', msgInput);

    const tempId = Date.now();
    if (p2pStatus === 'open') {
      sendP2P({
        senderId: user!.id,
        receiverId: selectedUser.id,
        content: msgInput,
        file: fileData || undefined,
      });
    }

    const tempMsg: StoredMessage = {
      id: tempId,
      senderId: user!.id,
      receiverId: selectedUser.id,
      content: msgInput,
      timestamp: new Date().toISOString(),
      synced: false,
      file: fileData || undefined,
    };

    appendMessage(user!.id, selectedUser.id, tempMsg);
    setLocalMessages((prev) => [...prev, tempMsg]);

    if (p2pStatus !== 'open') {
      try {
        const saved = await apiClient.request<Message>('/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: selectedUser.id,
            content: msgInput,
          }),
        });

        console.info('Message sent to server', {
          from: user!.id,
          to: selectedUser.id,
        });

        // replace temporary message with saved one
        const updated: StoredMessage = {
          ...saved,
          file: fileData || undefined,
          synced: true,
        };
        setLocalMessages((prev) =>
          prev.map((m) => (m.id === tempId ? updated : m))
        );
        const stored = loadMessages(user!.id, selectedUser.id).map((m) =>
          m.id === tempId ? updated : m
        );
        saveMessages(user!.id, selectedUser.id, stored);
      } catch (err) {
        console.error('Failed to send message', err);
      }
    }

    setMsgInput('');
    setFileData(null);
    refetchHistory();
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMsgInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const max = 96; // limit growth
      const newHeight = Math.min(textareaRef.current.scrollHeight, max);
      textareaRef.current.style.height = `${newHeight}px`;
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  };

  /* ───── UI ───── */
  if (!user) return null;

  return (
    <div className="flex h-full overflow-hidden bg-background relative">
      {/* contacts */}
      {!contactsCollapsed && (
        <aside
          className={`w-64 border-r border-border bg-background overflow-y-auto ${selectedUser ? 'hidden md:block' : ''}`}
        >
          <div className="hidden md:flex justify-end p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setContactsCollapsed(true)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
{isLoadingUsers ? (
  <div className="p-4 flex justify-center">
    <Loader2 className="h-5 w-5 animate-spin" />
  </div>
) : usersError ? (
  <p className="p-4 text-red-500">Contacts error</p>
) : (
  contacts
    .filter((u) => u.id !== user.id)
    .map((u) => (
      <Card
        key={u.id}
        onClick={() => setSelectedUser(u)}
        className={cn(
          'm-2 cursor-pointer hover:shadow-md transition-shadow',
          selectedUser?.id === u.id
            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
            : 'hover:bg-muted/50'
        )}
        role="button"
        tabIndex={0}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {u.avatarUrl ? (
              <img
                src={u.avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <AvatarFallback>
                {getInitials(u.firstName, u.lastName)}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="flex-1 truncate">
            {u.firstName} {u.lastName}
          </span>
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              u.isonline ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            )}
          />
        </CardContent>
      </Card>
    ))
)}
</aside>
      )}
{contactsCollapsed && (
  <div className="hidden md:flex flex-col border-r border-border">
    <Button
      variant="ghost"
      size="icon"
      className="m-2"
      onClick={() => setContactsCollapsed(false)}
    >
      <ChevronRight className="h-5 w-5" />
    </Button>
  </div>
)}

      {/* chat */}
      <section className="flex-1 flex flex-col">
        {selectedUser && (
          <div className="md:hidden flex items-center gap-2 p-3 border-b border-border bg-background">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedUser(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="flex-1 font-medium">
              {selectedUser.firstName} {selectedUser.lastName}
            </span>
            {onStartCall && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    onStartCall('audio', {
                      id: selectedUser.id,
                      name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                    })
                  }
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    onStartCall('video', {
                      id: selectedUser.id,
                      name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                    })
                  }
                >
                  <Video className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
            {t('messages.noChat')}
          </div>
        ) : (
          <>
              <div
                ref={messageWrapRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4"
              >
                {isLoadingMessages ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <MessageList messages={visibleMessages} myId={user.id} />
                )}
              </div>

            <form
              onSubmit={sendMessage}
              className="border-t border-border bg-background p-3 flex flex-col gap-2"
            >
              {fileData && (
                <span className="text-xs text-gray-500">{t('messages.fileAttached')}</span>
              )}
              <div className="flex gap-3 items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Textarea
                  ref={textareaRef}
                  className="flex-1 resize-none max-h-24 overflow-y-auto"
                  placeholder={t('messages.enterMessage')}
                  value={msgInput}
                  onChange={handleInput}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return setFileData(null);
                    const reader = new FileReader();
                    reader.onload = () => setFileData(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                <Button type="submit" disabled={!msgInput.trim() && !fileData}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
