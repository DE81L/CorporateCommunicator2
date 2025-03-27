import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/lib/useWebSocket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, Video, MoreVertical, Paperclip, Send } from "lucide-react";
import { formatDistance } from "date-fns";

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
  onStartCall: (type: "video" | "audio", recipient: { id: number; name: string }) => void;
}

export default function MessagesSection({ onStartCall }: MessagesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, lastMessage } = useWebSocket();
  
  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Fetch messages when a user is selected
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedUser?.id],
    enabled: !!selectedUser,
  });
  
  // Listen for new messages from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'chat') {
      // If the message is from the selected user, refetch messages
      if (selectedUser && 
          ((lastMessage.senderId === selectedUser.id && lastMessage.receiverId === user?.id) ||
           (lastMessage.senderId === user?.id && lastMessage.receiverId === selectedUser.id))) {
        queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedUser.id] });
      }
    }
  }, [lastMessage, selectedUser, user]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedUser) return;
    
    sendMessage({
      type: 'chat',
      receiverId: selectedUser.id,
      content: messageInput.trim()
    });
    
    // Clear input
    setMessageInput("");
  };
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {selectedUser ? (
        <>
          {/* Chat header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                  ) : (
                    <AvatarFallback className="bg-primary-100 text-primary-600">
                      {getInitials(selectedUser.firstName, selectedUser.lastName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="text-lg font-medium">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <p className="text-sm text-gray-500">{selectedUser.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onStartCall("audio", { 
                  id: selectedUser.id, 
                  name: `${selectedUser.firstName} ${selectedUser.lastName}` 
                })}
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onStartCall("video", { 
                  id: selectedUser.id, 
                  name: `${selectedUser.firstName} ${selectedUser.lastName}` 
                })}
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Messages area */}
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
                      className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} mb-4`}
                    >
                      <div className="flex items-end">
                        {!isOwnMessage && (
                          <Avatar className="h-8 w-8 mr-2">
                            {selectedUser.avatarUrl ? (
                              <img src={selectedUser.avatarUrl} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                            ) : (
                              <AvatarFallback className="bg-primary-100 text-primary-600">
                                {getInitials(selectedUser.firstName, selectedUser.lastName)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        )}
                        <div 
                          className={`${
                            isOwnMessage 
                              ? 'bg-primary-600 text-white rounded-lg rounded-br-none' 
                              : 'bg-gray-100 rounded-lg rounded-bl-none'
                          } py-2 px-4 max-w-xs break-words`}
                        >
                          {message.content}
                        </div>
                      </div>
                      <span className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? '' : 'ml-10'}`}>
                        {formatDistance(messageDate, new Date(), { addSuffix: true })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                Start a conversation with {selectedUser.firstName}
              </div>
            )}
          </div>
          
          {/* Message input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={sendChatMessage} className="flex space-x-2">
              <Button type="button" variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full"
              />
              <Button type="submit" size="icon" className="rounded-full">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-2">Your Messages</h2>
          <p className="text-gray-500 text-center mb-6">
            Select a contact to start messaging
          </p>
          
          <div className="w-full max-w-md">
            <h3 className="font-medium mb-3">Contacts</h3>
            {isLoadingUsers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-2">
                {users
                  .filter(u => u.id !== user?.id) // Filter out current user
                  .map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={`${u.firstName} ${u.lastName}`} />
                        ) : (
                          <AvatarFallback className="bg-primary-100 text-primary-600">
                            {getInitials(u.firstName, u.lastName)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">{u.firstName} {u.lastName}</div>
                        <p className="text-sm text-gray-500">{u.isOnline ? 'Online' : 'Offline'}</p>
                      </div>
                    </button>
                  ))
                }
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No contacts found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
