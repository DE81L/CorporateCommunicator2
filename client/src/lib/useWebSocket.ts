import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useElectron } from '@/hooks/use-electron';

interface Message {
  type: string;
  [key: string]: any;
}

interface WebSocketHook {
  sendMessage: (message: Message) => void;
  lastMessage: Message | null;
  readyState: number;
  connectionStatus: 'connecting' | 'open' | 'closing' | 'closed' | 'offline';
}

export function useWebSocket(): WebSocketHook {
  const { user } = useAuth();
  const { isElectron, api } = useElectron();
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const socketRef = useRef<WebSocket | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Check online status in Electron
  useEffect(() => {
    if (isElectron && api?.system) {
      const checkOnlineStatus = async () => {
        try {
          const online = await api.system.isOnline();
          setIsOffline(!online);
        } catch (error) {
          console.error('Failed to check online status:', error);
          setIsOffline(true);
        }
      };
      
      checkOnlineStatus();
      // Check online status every 30 seconds
      const interval = setInterval(checkOnlineStatus, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isElectron, api]);

  // Load messages from local storage when in Electron offline mode
  useEffect(() => {
    if (isElectron && isOffline && api?.storage && user) {
      const loadOfflineMessages = async () => {
        try {
          const messages = await api.storage.getMessages();
          if (messages && messages.length > 0) {
            // Set the last message from storage
            setLastMessage(messages[messages.length - 1]);
          }
        } catch (error) {
          console.error('Failed to load messages from local storage:', error);
        }
      };
      
      loadOfflineMessages();
    }
  }, [isElectron, isOffline, api, user]);

  useEffect(() => {
    if (!user) return;
    
    // Skip WebSocket connection in Electron if offline
    if (isElectron && isOffline) {
      setReadyState(WebSocket.CLOSED);
      return;
    }

    // Setup WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let socket: WebSocket;
    
    try {
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setReadyState(WebSocket.OPEN);
        // Authenticate the WebSocket connection
        socket.send(JSON.stringify({
          type: 'auth',
          userId: user.id.toString()
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          
          // Save message to Electron local storage if in Electron mode
          if (isElectron && api?.storage && data.type === 'message') {
            api.storage.saveMessage(data).catch(err => 
              console.error('Failed to save message to local storage:', err)
            );
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onclose = () => {
        setReadyState(WebSocket.CLOSED);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setReadyState(WebSocket.CLOSED);
      };
      
      // Clean up the WebSocket connection on unmount
      return () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setReadyState(WebSocket.CLOSED);
    }
  }, [user, isElectron, isOffline, api]);

  // Function to send a message through the WebSocket
  const sendMessage = useCallback((message: Message) => {
    // In Electron offline mode, store the message locally
    if (isElectron && isOffline && api?.storage && message.type === 'message') {
      // Add timestamp for offline messages
      const offlineMessage = {
        ...message,
        timestamp: new Date().toISOString(),
        offline: true
      };
      
      // Store the message locally
      api.storage.saveMessage(offlineMessage).catch(err => 
        console.error('Failed to save offline message to local storage:', err)
      );
      
      // Update UI immediately with the offline message
      setLastMessage(offlineMessage);
      
      return;
    }
    
    // Normal online mode
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, [isElectron, isOffline, api]);

  // Convert readyState to a more readable status
  const getConnectionStatus = () => {
    // Override status if in Electron offline mode
    if (isElectron && isOffline) {
      return 'offline';
    }
    
    switch (readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'closed';
    }
  };

  return {
    sendMessage,
    lastMessage,
    readyState,
    connectionStatus: getConnectionStatus()
  };
}
