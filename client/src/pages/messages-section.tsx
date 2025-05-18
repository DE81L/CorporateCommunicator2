import { FormEvent, useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  receiverId?: number;
  content: string;
  timestamp: string;
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
  const [incomingSignal, setIncomingSignal] = useState<any>(null);
  const [contactsCollapsed, setContactsCollapsed] = useState(false);

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

  useEffect(() => {
    if (user && selectedUser) {
      setLocalMessages(loadMessages(user.id, selectedUser.id));
    }
  }, [user, selectedUser]);

  useEffect(() => {
    if (user && selectedUser) {
      saveMessages(user.id, selectedUser.id, messages);
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
    (signal) =>
      sendRaw({
        type: 'p2p-signal',
        payload: { to: selectedUser!.id, signal },
      }),
    incomingSignal,
  );

  /* ───── WS side‑effects ───── */
  useEffect(() => {
    if (!lastRawMessage) return;
    const { type, payload } = lastRawMessage as WsPacket<any>;

    if (
      type === 'user-status' &&
      selectedUser &&
      payload.userId === selectedUser.id &&
      payload.isonline === 1
    ) {
      // собеседник появился в сети – peer‑hook пересоздастся
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
      refetchHistory();
    }
  }, [p2pMsg, selectedUser, user, refetchHistory]);

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

  // clear local messages once server history arrives
  useEffect(() => {
    if (messages.length > 0 && localMessages.length > 0) {
      setLocalMessages([]);
    }
  }, [messages]);

  // periodic refresh while chat is open
  useEffect(() => {
    if (!selectedUser) return;
    const id = setInterval(() => {
      void refetchHistory();
    }, 500);
    return () => clearInterval(id);
  }, [selectedUser, refetchHistory]);

  /* ───── send ───── */
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !selectedUser) return;

    console.log('Sending message', msgInput);

    if (p2pStatus === 'open') {
      sendP2P({
        senderId: user!.id,
        receiverId: selectedUser.id,
        content: msgInput,
      });
    } else {
      await apiClient.request<Message>('/messages', {
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
    }

    const msg: StoredMessage = {
      id: Date.now(),
      senderId: user!.id,
      receiverId: selectedUser.id,
      content: msgInput,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    appendMessage(user!.id, selectedUser.id, msg);
    setLocalMessages((prev) => [...prev, msg]);

    setMsgInput('');
    refetchHistory();
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
  users
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
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingMessages ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <MessageList messages={combinedMessages} myId={user.id} />
                )}
              </div>

            <form
              onSubmit={sendMessage}
              className="border-t border-border bg-background p-3 flex gap-3"
            >
              <Input
                className="flex-1"
                placeholder={t('messages.enterMessage')}
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
              />
              <Button type="submit" disabled={!msgInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
