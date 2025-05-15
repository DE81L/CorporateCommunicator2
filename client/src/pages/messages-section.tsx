// client/src/pages/messages-section.tsx
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket, WSMessage } from '@/hooks/useWebSocket';
import { usePeerConnection } from '../hooks/usePeerConnection';
import { createApiClient } from '@/lib/api-client';
import { Send } from 'lucide-react';
import { Input, Button, Loader2, Avatar, AvatarFallback } from '@/components/ui';

interface Message {
  id: number;
  senderId: number;
  receiverId?: number;
  content: string;
  timestamp: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  isonline: 0 | 1;
}

export default function MessagesSection() {
  const { user } = useAuth();
  const apiClient = createApiClient();
  const { connectionStatus, lastRawMessage, sendRaw } = useWebSocket();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [msgInput, setMsgInput] = useState('');
  const [incomingSignal, setIncomingSignal] = useState<any>(null);

  // REST: contacts & history
  const { data: contacts = [] } = useQuery<User[]>({
    queryKey: ['contacts'],
    queryFn: async () =>
      (await apiClient.request<User[]>('/contacts')) ?? [],
  });
  const {
    data: history = [],
    refetch: refetchHistory,
  } = useQuery<Message[]>({
    queryKey: ['messages', selectedUser?.id],
    enabled: !!selectedUser,
    queryFn: async () =>
    (await apiClient.request<Message[]>(
      `/messages?chatWith=${selectedUser!.id}`
    )) ?? [],
  });

  // P2P-hook
  const isInitiator =
    selectedUser != null &&
    user != null &&
    user.id < selectedUser.id;
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
    incomingSignal
  );

  // Авто-реакция на WS-события
  useEffect(() => {
    if (!lastRawMessage) return;
    const { type, payload } = lastRawMessage as WSMessage<any>;

    if (type === 'user-status') {
      // Когда выбранный контакт в сети — инициируем P2P
      if (
        selectedUser &&
        payload.userId === selectedUser.id &&
        payload.isonline === 1 &&
        connectionStatus === 'open'
      ) {
        // просто ререндерит P2P-hook с isInitiator
      }
    }

    if (type === 'p2p-signal') {
      // Получили сигнал от peer — передаём в usePeerConnection
      if (payload.from === selectedUser?.id) {
        setIncomingSignal(payload.signal);
      }
    }

    if (type === 'chat') {
      // Серверное сообщение: подгружаем историю
      if (
        selectedUser &&
        (payload.senderId === selectedUser.id ||
          payload.senderId === user?.id)
      ) {
        refetchHistory();
      }
    }
  }, [lastRawMessage, selectedUser, connectionStatus, user, refetchHistory]);

  // P2P-сообщения в чат
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !selectedUser) return;

    if (p2pStatus === 'open') {
      // P2P-канал
      sendP2P({ senderId: user!.id, receiverId: selectedUser.id, content: msgInput });
    } else {
      // REST+WS fallback
      await apiClient.request<Message>('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: msgInput,
        }),
      });
    }

    setMsgInput('');
    refetchHistory();
  };

  const getInitials = (f: string, l: string) =>
    `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {!selectedUser ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h3 className="font-medium mb-3">{t("nav.users")}</h3>
            {isLoadingUsers ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : usersError ? (
              <p className="text-red-500">Ошибка загрузки контактов</p>
            ) : (
              users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <Avatar className="h-10 w-10 mr-3">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={`${u.firstName} ${u.lastName}`}
                      />
                    ) : (
                      <AvatarFallback className="bg-primary-100 text-primary-600">
                        {getInitials(u.firstName, u.lastName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {u.firstName} {u.lastName}
                    </div>
                    <p className="text-sm text-gray-500">
                      {u.isOnline
                        ? t("profile.online")
                        : t("profile.offline")}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Здесь ваш UI переписки */}
          <div className="flex-1 overflow-auto p-4">
            {isLoadingMessages ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              messages.map((m) => (
                <div key={m.id} className="mb-2">
                  <strong>
                    {m.senderId === user?.id ? "Вы" : selectedUser.firstName}
                    :
                  </strong>{" "}
                  {m.content}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={sendChatMessage}
            className="p-4 border-t flex space-x-2"
          >
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={t("messages.typeHere")}
            />
            <Button type="submit">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
