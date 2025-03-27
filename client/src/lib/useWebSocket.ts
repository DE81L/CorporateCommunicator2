import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface Message {
  type: string;
  [key: string]: any;
}

interface WebSocketHook {
  sendMessage: (message: Message) => void;
  lastMessage: Message | null;
  readyState: number;
  connectionStatus: 'connecting' | 'open' | 'closing' | 'closed';
}

export function useWebSocket(): WebSocketHook {
  const { user } = useAuth();
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    // Setup WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
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
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      setReadyState(WebSocket.CLOSED);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Clean up the WebSocket connection on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user]);

  // Function to send a message through the WebSocket
  const sendMessage = useCallback((message: Message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  // Convert readyState to a more readable status
  const getConnectionStatus = () => {
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
