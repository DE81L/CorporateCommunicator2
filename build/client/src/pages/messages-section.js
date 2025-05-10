"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MessagesSection;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const use_auth_1 = require("../hooks/use-auth");
const useWebSocket_1 = require("../hooks/useWebSocket");
const input_1 = require("@/components/ui/input");
const button_1 = require("@/components/ui/button");
const avatar_1 = require("@/components/ui/avatar");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const queryClient_1 = require("@/lib/queryClient");
const use_translations_1 = require("@/hooks/use-translations");
const api_client_1 = require("@/lib/api-client");
function MessagesSection({ onStartCall }) {
    const { user } = (0, use_auth_1.useAuth)();
    const [selectedUser, setSelectedUser] = (0, react_1.useState)(null);
    const [messageInput, setMessageInput] = (0, react_1.useState)("");
    const messagesEndRef = (0, react_1.useRef)(null);
    const { sendMessage, lastMessage } = (0, useWebSocket_1.useWebSocket)();
    const { t } = (0, use_translations_1.useTranslations)();
    const apiClient = (0, api_client_1.createApiClient)();
    // Получение списка пользователей
    const { data: users, isLoading: isLoadingUsers } = (0, react_query_1.useQuery)({
        queryKey: ["/api/users"],
        queryFn: async () => {
            return await apiClient.request("/api/users");
        }
    });
    // Получение сообщений при выборе пользователя
    const { data: messages, isLoading: isLoadingMessages } = (0, react_query_1.useQuery)({
        queryKey: ["/api/messages", selectedUser?.id],
        enabled: !!selectedUser,
        queryFn: async () => {
            return await apiClient.request(`/api/messages?chatWith=${selectedUser.id}`);
        }
    });
    // Прослушивание новых сообщений из WebSocket
    (0, react_1.useEffect)(() => {
        if (lastMessage) {
            if (lastMessage) {
                // Если сообщение от выбранного пользователя, обновляем список сообщений
                if (selectedUser &&
                    ((lastMessage.sender?.id === selectedUser.id &&
                        lastMessage.chatId) ||
                        (lastMessage.sender?.id === user?.id &&
                            lastMessage.chatId))) {
                    queryClient_1.queryClient.invalidateQueries({
                        queryKey: ["/api/messages", selectedUser.id],
                    });
                }
            }
        }
    }, [lastMessage, selectedUser, user]);
    // Прокрутка вниз при появлении новых сообщений
    (0, react_1.useEffect)(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const sendChatMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedUser)
            return;
        sendMessage(messageInput.trim(), selectedUser.id);
        // Очистка поля ввода
        setMessageInput("");
    };
    const getInitials = (firstName, lastName) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };
    return (<div className="flex-1 flex flex-col overflow-hidden">
      {selectedUser ? (<>
          {/* Заголовок чата */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <avatar_1.Avatar className="h-10 w-10 mr-3">
                  {selectedUser.avatarUrl ? (<img src={selectedUser.avatarUrl} alt={`${selectedUser.firstName} ${selectedUser.lastName}`}/>) : (<avatar_1.AvatarFallback className="bg-primary-100 text-primary-600">
                      {getInitials(selectedUser.firstName, selectedUser.lastName)}
                    </avatar_1.AvatarFallback>)}
                </avatar_1.Avatar>
                <div>
                  <h2 className="text-lg font-medium">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button_1.Button onClick={() => onStartCall("audio", {
                id: selectedUser.id,
                name: `${selectedUser.firstName} ${selectedUser.lastName}`,
            })} variant="ghost" size="icon" title={t("profile.call")}>
                <lucide_react_1.Phone className="h-5 w-5"/>
              </button_1.Button>
              <button_1.Button onClick={() => onStartCall("video", {
                id: selectedUser.id,
                name: `${selectedUser.firstName} ${selectedUser.lastName}`,
            })} variant="ghost" size="icon" title={t("profile.videoCall")}>
                <lucide_react_1.Video className="h-5 w-5"/>
              </button_1.Button>
            </div>
          </div>

          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingMessages ? (<div className="flex justify-center items-center h-full">
                <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-primary"/>
              </div>) : messages && messages.length > 0 ? (<>
                {messages.map((message) => {
                    const isOwnMessage = message.senderId === user?.id;
                    const messageDate = new Date(message.timestamp);
                    return (<div key={message.id} className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} mb-4`}>
                      <div className="flex items-end">
                        {!isOwnMessage && (<avatar_1.Avatar className="h-8 w-8 mr-2">
                            {selectedUser.avatarUrl ? (<img src={selectedUser.avatarUrl} alt={`${selectedUser.firstName} ${selectedUser.lastName}`}/>) : (<avatar_1.AvatarFallback className="bg-primary-100 text-primary-600">
                                {getInitials(selectedUser.firstName, selectedUser.lastName)}
                              </avatar_1.AvatarFallback>)}
                          </avatar_1.Avatar>)}
                        <div className={`${isOwnMessage
                            ? "bg-primary-600 text-white rounded-lg rounded-br-none"
                            : "bg-gray-100 rounded-lg rounded-bl-none"} py-2 px-4 max-w-xs break-words`}>
                          {message.content}
                        </div>
                      </div>
                      <span className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? "" : "ml-10"}`}>
                        {(0, date_fns_1.formatDistance)(messageDate, new Date(), {
                            addSuffix: true,
                            locale: locale_1.ru,
                        })}
                      </span>
                    </div>);
                })}
                <div ref={messagesEndRef}/>
              </>) : (<div className="flex justify-center items-center h-full text-gray-500">
                Начните диалог с {selectedUser.firstName}
              </div>)}
          </div>

          {/* Поле ввода сообщения */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={sendChatMessage} className="flex space-x-2">
              <button_1.Button type="button" variant="ghost" size="icon" title="Прикрепить файл"> 
                <lucide_react_1.Paperclip className="h-5 w-5"/>
              </button_1.Button>
              <input_1.Input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder={t("messages.enterMessage")} className="flex-1 rounded-full"/>
              <button_1.Button type="submit" size="icon" className="rounded-full disabled:opacity-50" title={t("messages.send")}>
                <lucide_react_1.Send className="h-5 w-5"/>
              </button_1.Button>
            </form>
          </div>
        </>) : (<div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-2">
            {t("messages.noChat")}
          </h2>  
          <div className="w-full max-w-md">
            <h3 className="font-medium mb-3">{t("nav.users")}</h3>
            {isLoadingUsers ? (<div className="flex justify-center items-center py-4">
                <lucide_react_1.Loader2 className="h-6 w-6 animate-spin text-primary"/>
              </div>) : Array.isArray(users) && users.length > 0 ? (<div className="space-y-2">
                {users
                    .filter((u) => u.id !== user?.id)
                    .map((u) => (<button key={u.id} onClick={() => setSelectedUser(u)} className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors text-left">
                      <avatar_1.Avatar className="h-10 w-10 mr-3">
                        {u.avatarUrl ? (<img src={u.avatarUrl} alt={`${u.firstName} ${u.lastName}`}/>) : (<avatar_1.AvatarFallback className="bg-primary-100 text-primary-600">
                            {getInitials(u.firstName, u.lastName)}
                          </avatar_1.AvatarFallback>)}
                      </avatar_1.Avatar>
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
                    </button>))} 
              </div>) : (<div className="text-center py-4 text-gray-500">
                {t("messages.noContacts")}
              </div>)}
          </div>
        </div>)}
    </div>);
}
