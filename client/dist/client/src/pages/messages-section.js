import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { useWebSocket } from "../hooks/useWebSocket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Phone, Video, Paperclip, Send } from "lucide-react";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";
import { queryClient } from "@/lib/queryClient";
import { useTranslations } from "@/hooks/use-translations";
import { createApiClient } from "@/lib/api-client";
export default function MessagesSection({ onStartCall }) {
    const { user } = useAuth();
    const [selectedUser, setSelectedUser] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const messagesEndRef = useRef(null);
    const { sendMessage, lastMessage } = useWebSocket();
    const { t } = useTranslations();
    const apiClient = createApiClient();
    // Получение списка пользователей
    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["/api/users"],
        queryFn: async () => {
            return await apiClient.request("/api/users");
        }
    });
    // Получение сообщений при выборе пользователя
    const { data: messages, isLoading: isLoadingMessages } = useQuery({
        queryKey: ["/api/messages", selectedUser?.id],
        enabled: !!selectedUser,
        queryFn: async () => {
            return await apiClient.request(`/api/messages?chatWith=${selectedUser.id}`);
        }
    });
    // Прослушивание новых сообщений из WebSocket
    useEffect(() => {
        if (lastMessage) {
            if (lastMessage) {
                // Если сообщение от выбранного пользователя, обновляем список сообщений
                if (selectedUser &&
                    ((lastMessage.sender?.id === selectedUser.id &&
                        lastMessage.chatId) ||
                        (lastMessage.sender?.id === user?.id &&
                            lastMessage.chatId))) {
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
    return (_jsx("div", { className: "flex-1 flex flex-col overflow-hidden", children: selectedUser ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-white border-b border-gray-200 p-4 flex items-center", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Avatar, { className: "h-10 w-10 mr-3", children: selectedUser.avatarUrl ? (_jsx("img", { src: selectedUser.avatarUrl, alt: `${selectedUser.firstName} ${selectedUser.lastName}` })) : (_jsx(AvatarFallback, { className: "bg-primary-100 text-primary-600", children: getInitials(selectedUser.firstName, selectedUser.lastName) })) }), _jsx("div", { children: _jsxs("h2", { className: "text-lg font-medium", children: [selectedUser.firstName, " ", selectedUser.lastName] }) })] }) }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { onClick: () => onStartCall("audio", {
                                        id: selectedUser.id,
                                        name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                                    }), variant: "ghost", size: "icon", title: t("profile.call"), children: _jsx(Phone, { className: "h-5 w-5" }) }), _jsx(Button, { onClick: () => onStartCall("video", {
                                        id: selectedUser.id,
                                        name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                                    }), variant: "ghost", size: "icon", title: t("profile.videoCall"), children: _jsx(Video, { className: "h-5 w-5" }) })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-4", children: isLoadingMessages ? (_jsx("div", { className: "flex justify-center items-center h-full", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) })) : messages && messages.length > 0 ? (_jsxs(_Fragment, { children: [messages.map((message) => {
                                const isOwnMessage = message.senderId === user?.id;
                                const messageDate = new Date(message.timestamp);
                                return (_jsxs("div", { className: `flex flex-col ${isOwnMessage ? "items-end" : "items-start"} mb-4`, children: [_jsxs("div", { className: "flex items-end", children: [!isOwnMessage && (_jsx(Avatar, { className: "h-8 w-8 mr-2", children: selectedUser.avatarUrl ? (_jsx("img", { src: selectedUser.avatarUrl, alt: `${selectedUser.firstName} ${selectedUser.lastName}` })) : (_jsx(AvatarFallback, { className: "bg-primary-100 text-primary-600", children: getInitials(selectedUser.firstName, selectedUser.lastName) })) })), _jsx("div", { className: `${isOwnMessage
                                                        ? "bg-primary-600 text-white rounded-lg rounded-br-none"
                                                        : "bg-gray-100 rounded-lg rounded-bl-none"} py-2 px-4 max-w-xs break-words`, children: message.content })] }), _jsx("span", { className: `text-xs text-gray-500 mt-1 ${isOwnMessage ? "" : "ml-10"}`, children: formatDistance(messageDate, new Date(), {
                                                addSuffix: true,
                                                locale: ru,
                                            }) })] }, message.id));
                            }), _jsx("div", { ref: messagesEndRef })] })) : (_jsxs("div", { className: "flex justify-center items-center h-full text-gray-500", children: ["\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0434\u0438\u0430\u043B\u043E\u0433 \u0441 ", selectedUser.firstName] })) }), _jsx("div", { className: "bg-white border-t border-gray-200 p-4", children: _jsxs("form", { onSubmit: sendChatMessage, className: "flex space-x-2", children: [_jsx(Button, { type: "button", variant: "ghost", size: "icon", title: "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u044C \u0444\u0430\u0439\u043B", children: _jsx(Paperclip, { className: "h-5 w-5" }) }), _jsx(Input, { value: messageInput, onChange: (e) => setMessageInput(e.target.value), placeholder: t("messages.enterMessage"), className: "flex-1 rounded-full" }), _jsx(Button, { type: "submit", size: "icon", className: "rounded-full disabled:opacity-50", title: t("messages.send"), children: _jsx(Send, { className: "h-5 w-5" }) })] }) })] })) : (_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-6", children: [_jsx("div", { className: "h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center mb-4", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-12 w-12 text-primary-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" }) }) }), _jsx("h2", { className: "text-xl font-medium mb-2", children: t("messages.noChat") }), _jsxs("div", { className: "w-full max-w-md", children: [_jsx("h3", { className: "font-medium mb-3", children: t("nav.users") }), isLoadingUsers ? (_jsx("div", { className: "flex justify-center items-center py-4", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) })) : Array.isArray(users) && users.length > 0 ? (_jsx("div", { className: "space-y-2", children: users
                                .filter((u) => u.id !== user?.id)
                                .map((u) => (_jsxs("button", { onClick: () => setSelectedUser(u), className: "w-full flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors text-left", children: [_jsx(Avatar, { className: "h-10 w-10 mr-3", children: u.avatarUrl ? (_jsx("img", { src: u.avatarUrl, alt: `${u.firstName} ${u.lastName}` })) : (_jsx(AvatarFallback, { className: "bg-primary-100 text-primary-600", children: getInitials(u.firstName, u.lastName) })) }), _jsxs("div", { children: [_jsxs("div", { className: "font-medium", children: [u.firstName, " ", u.lastName] }), _jsx("p", { className: "text-sm text-gray-500", children: u.isOnline
                                                    ? t("profile.online")
                                                    : t("profile.offline") })] })] }, u.id))) })) : (_jsx("div", { className: "text-center py-4 text-gray-500", children: t("messages.noContacts") }))] })] })) }));
}
