import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { useWebSocket } from "../hooks/useWebSocket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Phone,
  Video,
  Paperclip,
  Send,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";
import { queryClient } from "@/lib/queryClient";
import { useTranslations } from "@/hooks/use-translations";

interface Message {
  id: number;
  senderId: number;
  receiverId?: number;
  groupId?: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  isOnline: boolean;
  avatarUrl?: string;
}

interface MessagesProps {
  onStartCall: (
    type: "video" | "audio",
    recipient: { id: number; name: string },
  ) => void;
}

export default function MessagesSection({ onStartCall }: MessagesProps) {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [contactsCollapsed, setContactsCollapsed] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, lastMessage } = useWebSocket();
  const { t } = useTranslations();

  // Получение списка пользователей
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Получение сообщений при выборе пользователя
  const {
    data: messages,
    isLoading: isLoadingMessages,
  } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedUser?.id],
    enabled: !!selectedUser,
    onSuccess: (data) => {
      console.log(
        "Fetched messages for user",
        selectedUser?.id,
        data,
      );
    },
    onError: (err) => {
      console.error("Failed to fetch messages:", err);
    },
  });

  // Прослушивание новых сообщений из WebSocket
  useEffect(() => {
    if (lastMessage) {
        if (lastMessage) {
        // Если сообщение от выбранного пользователя, обновляем список сообщений
        if (
          selectedUser &&
          ((lastMessage.sender?.id === selectedUser.id &&
              lastMessage.chatId) ||
            (lastMessage.sender?.id === user?.id &&
                lastMessage.chatId))
              ) {
          queryClient.invalidateQueries({
            queryKey: ["/api/messages", selectedUser.id],
          });
        }
      }
    }
  }, [lastMessage, selectedUser, user]);

  // Прокрутка вниз при появлении новых сообщений
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Логирование полученных сообщений для отладки
  useEffect(() => {
    if (messages) {
      console.log("Displaying messages for user", selectedUser?.id, messages);
    }
  }, [messages, selectedUser]);

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedUser) return;

    console.log(
      "Sending message to",
      selectedUser.id,
      ":",
      messageInput.trim(),
    );
    sendMessage(messageInput.trim(), selectedUser.id);
    

    // Очистка поля ввода
    setMessageInput("");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {selectedUser ? (
        <>
          {/* Заголовок чата */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between dark:bg-gray-800 dark:border-gray-700">
            {!contactsCollapsed && (
              <div className="flex-1">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    {selectedUser.avatarUrl ? (
                      <img
                        src={selectedUser.avatarUrl}
                        alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      />
                    ) : (
                      <AvatarFallback className="bg-primary-100 text-primary-600">
                        {getInitials(
                          selectedUser.firstName,
                          selectedUser.lastName,
                        )}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-medium">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h2>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              {!contactsCollapsed && (
                <>
                  <Button
                    onClick={() =>
                      onStartCall("audio", {
                        id: selectedUser.id,
                        name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                      })
                    }
                    variant="ghost"
                    size="icon"
                    title={t("profile.call")}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={() =>
                      onStartCall("video", {
                        id: selectedUser.id,
                        name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                      })
                    }
                    variant="ghost"
                    size="icon"
                    title={t("profile.videoCall")}
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                </>
              )}
              <Button
                onClick={() => setContactsCollapsed(!contactsCollapsed)}
                variant="ghost"
                size="icon"
                title={
                  contactsCollapsed
                    ? t("messages.showContacts" as any)
                    : t("messages.hideContacts" as any)
                }
              >
                {contactsCollapsed ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : messages && messages.length > 0 ? (
              <>
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user?.id;
                  const messageDate = new Date(message.timestamp);

                  return (
                    <div
                      key={message.id}
                      className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} mb-4`}
                    >
                      <div className="flex items-end">
                        {!isOwnMessage && (
                          <Avatar className="h-8 w-8 mr-2">
                            {selectedUser.avatarUrl ? (
                              <img
                                src={selectedUser.avatarUrl}
                                alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                              />
                            ) : (
                              <AvatarFallback className="bg-primary-100 text-primary-600">
                                {getInitials(
                                  selectedUser.firstName,
                                  selectedUser.lastName,
                                )}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        )}
                        <div
                          className={`${
                          isOwnMessage
                              ? "bg-primary-600 text-white rounded-lg rounded-br-none"
                              : "bg-gray-100 dark:bg-gray-800 rounded-lg rounded-bl-none"
                          } py-2 px-4 max-w-xs break-words`}
                        >
                          {message.content}
                        </div>
                      </div>
                      <span
                        className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isOwnMessage ? "" : "ml-10"}`}
                      >
                        {formatDistance(messageDate, new Date(), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
                Начните диалог с {selectedUser.firstName}
              </div>
            )}
          </div>

          {/* Поле ввода сообщения */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={sendChatMessage} className="flex space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Прикрепить файл"
              > 
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={t("messages.enterMessage" )}
                className="flex-1 rounded-full"
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full disabled:opacity-50" 
                title={t("messages.send" )}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="h-24 w-24 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-2">
            {t("messages.noChat" )}
          </h2>  
          <div className="w-full max-w-2xl">
            <h3 className="font-medium mb-3">{t("nav.users" )}</h3>
            {isLoadingUsers ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users && users.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {users
                  .filter((u) => u.id !== user?.id)
                  .map((u) => (
                    <Card
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4 flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={`${u.firstName} ${u.lastName}`}
                            />
                          ) : (
                            <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400">
                              {getInitials(u.firstName, u.lastName)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {u.firstName} {u.lastName}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {u.isOnline ? t("profile.online") : t("profile.offline")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                {t("messages.noContacts" as any)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
