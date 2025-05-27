import { FormEvent, useEffect, useState, useCallback, useRef } from 'react';
import { showError } from '@/lib/error-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  markMessagesRead,
  countUnreadMessages,
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
  Smile,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { MessageList } from '@/components/message-list';
import UserHoverCard from '@/components/user-hover-card';
import EmojiPicker from '@/components/emoji-picker';

/* ──────────────── TYPES ──────────────── */

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  status?: 'pending' | 'delivered' | 'read' | 'p2p';
  transport?: 'server' | 'p2p';
  synced?: boolean;
  error?: boolean;
  file?: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  email?: string;
  jobTitle?: string | null;
  isonline: 0 | 1;
}

interface WsPacket<T = any> {
  type: string;
  payload: T;
}

// interface Props {
//   onStartCall?: (
//     type: 'audio' | 'video',
//     recipient: { id: number; name: string },
//   ) => void;
// }

/* ──────────────── COMPONENT ──────────────── */

export default function MessagesSection({ onStartCall }: any) {
  const { user } = useAuth();
  const apiClient = createApiClient();
  const { t } = useTranslation();
  const { connectionStatus, lastRawMessage, sendRaw } = useWebSocket();

  const { chatUser: selectedUser, setChatUser: setSelectedUser } = useChat();
  const [msgInput, setMsgInput] = useState('');
  const [files, setFiles] = useState<{ name: string; data: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [incomingSignal, setIncomingSignal] = useState<any>(null);
  const signalQueueRef = useRef<Map<number, any[]>>(new Map());
  const [contactsCollapsed, setContactsCollapsed] = useState(false);
  const [contacts, setContacts] = useState<User[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

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
          `/messages?chatWith=${selectedUser!.id}&limit=${maxDisplay}`,
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
    if (selectedUser) {
      const q = signalQueueRef.current.get(selectedUser.id);
      if (q && q.length > 0) {
        setIncomingSignal(q.shift());
      }
    }
  }, [selectedUser]);

  useEffect(() => {
    if (user && selectedUser) {
      markMessagesRead(user.id, selectedUser.id);
      setLocalMessages(loadMessages(user.id, selectedUser.id));
    }
  }, [user, selectedUser]);

  useEffect(() => {
    if (user && selectedUser && messages.length > 0) {
      setLocalMessages((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        for (const srv of messages) {
          const existing = map.get(srv.id);
          map.set(srv.id, {
            ...existing,
            ...srv,
            synced: true,
            transport: existing?.transport ?? 'server',
          });
        }
        const merged = Array.from(map.values());
        const updated = merged.map((m) =>
          m.senderId === selectedUser.id ? { ...m, status: 'read' as const } : m,
        );
        saveMessages(user.id, selectedUser.id, updated);
        return updated;
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

  useEffect(() => {
    if (p2pStatus === 'closed' || p2pStatus === 'error') {
      showError(t('errors.connectionError'));
    }
  }, [p2pStatus, t]);

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

    if (type === 'p2p-signal') {
      const q = signalQueueRef.current.get(payload.from) || [];
      q.push(payload.signal);
      signalQueueRef.current.set(payload.from, q);
      if (payload.from === selectedUser?.id) {
        const sig = q.shift();
        if (sig) setIncomingSignal(sig);
      }
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
        transport: 'p2p',
        status: 'p2p',
        synced: true,
      };
      appendMessage(user!.id, selectedUser!.id, stored);
      markMessagesRead(user!.id, selectedUser!.id);
      setLocalMessages((prev) => {
        const updated = [...prev, stored].map((m) =>
          m.senderId === selectedUser!.id ? { ...m, status: 'read' as const } : m,
        );
        saveMessages(user!.id, selectedUser!.id, updated);
        return updated;
      });
      refetchHistory();
    }
  }, [p2pMsg, selectedUser, user, refetchHistory]);

  /* ───── helpers ───── */
  const getInitials = (f: string, l: string) =>
    `${f[0]}${l[0]}`.toUpperCase();


  // объединяем серверные и локальные сообщения без дубликатов
  const combinedMessages = Array.from(
    new Map(
      [...messages, ...localMessages].map((m) => [m.id, m]),
    ).values(),
  ).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const trimmedMessages = combinedMessages.slice(0, maxDisplay);
  const visibleMessages = trimmedMessages.slice(0, visibleCount).reverse();

  const displayMessages = visibleMessages;

  useEffect(() => {
    setVisibleCount((c) => {
      const baseline = Math.min(pageSize, trimmedMessages.length);
      const clamped = Math.min(c, trimmedMessages.length);
      return Math.max(clamped, baseline);
    });
  }, [trimmedMessages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop -
        e.currentTarget.clientHeight <
      50
    ) {
      setVisibleCount((c) =>
        Math.min(c + pageSize, Math.min(trimmedMessages.length, maxDisplay)),
      );
    }
  };





  /* ───── send ───── */
  const sendSingle = async (content: string, file?: string) => {
    const tempId = Date.now() + Math.random();
    const viaP2P = p2pStatus === 'open';

    if (viaP2P) {
      sendP2P({
        senderId: user!.id,
        receiverId: selectedUser!.id,
        content,
        file,
      });
    }

    const tempMsg: StoredMessage = {
      id: tempId,
      senderId: user!.id,
      receiverId: selectedUser!.id,
      content,
      timestamp: new Date().toISOString(),
      synced: viaP2P ? true : false,
      transport: viaP2P ? 'p2p' : 'server',
      status: viaP2P ? 'p2p' : 'pending',
      file,
    };

    appendMessage(user!.id, selectedUser!.id, tempMsg);
    setLocalMessages((prev) => [...prev, tempMsg]);

    if (p2pStatus !== 'open') {
      try {
        const saved = await apiClient.request<Message>('/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: selectedUser!.id,
            content,
            file,
          }),
        });
        if (!saved) return;

        const updated: StoredMessage = {
          ...tempMsg,
          ...saved,
          file: (saved.file ?? file) || tempMsg.file,
          synced: true,
          transport: 'server',
          status: saved.status,
          error: false,
        };
        setLocalMessages((prev) => prev.map((m) => (m.id === tempId ? updated : m)));
        const stored = loadMessages(user!.id, selectedUser!.id).map((m) =>
          m.id === tempId ? updated : m
        );
        saveMessages(user!.id, selectedUser!.id, stored);
      } catch (err) {
        showError(err, 'Failed to send message');
        setLocalMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, error: true } : m))
        );
      }
    }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() && files.length === 0) return;
    if (!selectedUser) return;

    await sendSingle(msgInput, files[0]?.data);
    for (let i = 1; i < files.length; i++) {
      await sendSingle('', files[i].data);
    }

    setMsgInput('');
    setFiles([]);
    refetchHistory();
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMsgInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const max = 96; // ограничиваем рост
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
          <div className="hidden md:flex items-center justify-between gap-2 p-2">
            <Input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value.toLowerCase())}
              placeholder={t('common.search')}
              className="h-8"
            />
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
    .filter((u) =>
      `${u.firstName} ${u.lastName}`
        .toLowerCase()
        .includes(contactSearch)
    )
    .map((u) => {
      const unread = countUnreadMessages(user.id, u.id);
      return (
        <UserHoverCard
          key={u.id}
          user={{
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            avatarUrl: u.avatarUrl,
            jobTitle: u.jobTitle,
            isonline: u.isonline,
          }}
          onMessage={() => setSelectedUser(u)}
        >
          <Card
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
              <Avatar className="h-8 w-8 relative">
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
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1 text-[10px]">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Avatar>
              <span className="flex-1 truncate">
                {u.firstName} {u.lastName}
              </span>
              {unread > 0 && (
                <span className="text-xs bg-red-500 text-white rounded-full px-1 mr-1">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  u.isonline ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
            </CardContent>
          </Card>
        </UserHoverCard>
      );
    })
)}
</aside>
      )}
{contactsCollapsed && (
  <div className="hidden md:flex w-16 flex-col items-center border-r border-border overflow-y-auto">
    <Button
      variant="ghost"
      size="icon"
      className="m-2"
      onClick={() => setContactsCollapsed(false)}
    >
      <ChevronRight className="h-5 w-5" />
    </Button>
    {contacts
      .filter((u) => u.id !== user.id)
      .map((u) => {
        const unread = countUnreadMessages(user.id, u.id);
        return (
          <UserHoverCard
            key={u.id}
            user={{
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              avatarUrl: u.avatarUrl,
              jobTitle: u.jobTitle,
              isonline: u.isonline,
            }}
            onMessage={() => setSelectedUser(u)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="m-2 relative"
              onClick={() => setSelectedUser(u)}
            >
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
              <span
                className={cn(
                  'absolute bottom-0 right-0 h-2 w-2 rounded-full',
                  u.isonline ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600',
                )}
              />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1 text-[10px]">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Button>
          </UserHoverCard>
        );
      })}
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
            {/*
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
            */}
          </div>
        )}
        {selectedUser && (
          <div className="hidden md:flex items-center gap-2 p-3 border-b border-border bg-background">
            <span className="flex-1 font-medium">
              {selectedUser.firstName} {selectedUser.lastName}
            </span>
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
                  <MessageList messages={displayMessages} myId={user.id} />
                )}
              </div>

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
              className={cn(
                'border-t border-border bg-background p-3 flex flex-col gap-2',
                dragOver && 'border-blue-500'
              )}
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPicker((s) => !s)}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  {showPicker && (
                    <EmojiPicker
                      onSelect={(e) => setMsgInput((m) => m + e)}
                      onClose={() => setShowPicker(false)}
                    />
                  )}
                </div>
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
          </>
        )}
      </section>
    </div>
  );
}
