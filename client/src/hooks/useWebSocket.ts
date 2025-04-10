import { useEffect, useRef, useState } from "react";
import { useAuth, User } from "./use-auth";
import { useElectron } from "./use-electron";

export type WebSocketMessage = {
  senderId: number;
  content: string;
  groupId?: number;
  chatId?: number;
  createdAt: string;
  updatedAt: string;
   sender: { username: string; id: number };
  id: number;
};
export type WebSocketHook = {
  sendMessage: (message: string, chatId: number) => void;
  lastMessage: WebSocketMessage | null;
  readyState: number;
  connectionStatus: string;
};


export type WebSocketMessage = Message;
export function useWebSocket(): WebSocketHook {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // Return early if user is not available

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const base = isElectron
      ? new URL(import.meta.env.VITE_API_URL).host
      : window.location.host;
    const wsUrl = `${protocol}//${base}/ws`;

    const socket = useRef<WebSocket | null>(null);

    socket.current = new WebSocket(wsUrl);
    setReadyState(socket.current.readyState);
    

    socket.current.addEventListener("open", () => {
      setReadyState(socket.current?.readyState ?? -1);
      setConnectionStatus("open");
      console.log("WebSocket connected");
    });
    setReadyState(socket.readyState);
    socket.current = new WebSocket(wsUrl);
    socketRef.current = socket.current;
    socket.addEventListener("message", (event) => {
      setReadyState(socket.readyState);
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(data);
        console.log("Received WebSocket message:", data, socket.readyState);
      } catch (error) {
        console.error("Error parsing WebSocket message", error);
      }
    });

    socket.addEventListener("error", (error) => {
      setConnectionStatus("Error");
      console.error("WebSocket error:", error);
    });

    socket.addEventListener("close", (event) => {
      setConnectionStatus("Closed");
      console.log("WebSocket connection closed:", event);
    });

    return () => socket.close();
  }, [user, isElectron]);


  const sendMessage = (message: string, chatId: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ type: "chat", content: message, chatId: chatId })
      );
    } else {
      console.error("WebSocket is not open.");
    }
  };

  return { sendMessage, lastMessage, readyState, connectionStatus };
}
