import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import { useElectron } from "./use-electron";

export type WebSocketMessageData = {
  type?:string
  msgId?:string
  from?:number
  timestamp?:number
  msgIds?:string[]
  messages?:any[]
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
  lastMessage: WebSocketMessageData | null;
  readyState?: number;
  connectionStatus: string;
};

export type WebSocketMessage = WebSocketMessageData;
  
export function useWebSocket(): WebSocketHook {
  const { user } = useAuth();
  const api = useElectron();
  const socket = useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessageData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting")
  const [readyState, setReadyState] = useState<number>(-1);
  useEffect(() => {
    if (!user) {
      return;
    }

    const base =
    api?.isElectron
      ? `ws://localhost:3000/ws`
      : `${window.location.origin.replace(/^http/, "ws")}/ws`;

    socket.current = new WebSocket(`${base}?userId=${user.id}`);

    socket.current.addEventListener("open", () => {        
        setConnectionStatus("open");
      setReadyState(socket.current?.readyState ?? -1);
      console.log("WebSocket connected");
      socket.current?.send(JSON.stringify({ type: "auth", userId: user.id }));
        // immediately request offline messages
        socket.current?.send(JSON.stringify({ type: "getOffline", userId: user.id }));
    });


    socket.current.addEventListener("message", (event: MessageEvent) => {
      if (socket.current) {
        try {
          const data: WebSocketMessageData = JSON.parse(event.data);
          setReadyState(socket.current.readyState);
          console.log("Received WebSocket message:", data, "readyState:", socket.current.readyState);
          
          if(data.type === "chat"){
            setLastMessage(data)
          }else if(data.type === "offlineBatch"){
              // process offline messages
              data.messages?.forEach((msg: any) => setLastMessage(msg));

              // confirm receipt
              const ids = data.messages?.map((m: any) => m.msgId);
              socket.current.send(JSON.stringify({ type: "ackOffline", msgIds: ids }));
          }
          else if (data.type === "startP2P") {
            // initiate direct WebRTC connection...
            console.log("start p2p")
          }
        
        } catch (error) {
          console.error("Error parsing WebSocket message", error);
        }
      }
    });

    socket.current.addEventListener("error", (error) => {
      setConnectionStatus("Error");
      setReadyState(socket.current?.readyState ?? -1);
      console.error("WebSocket error:", error);
    });

    socket.current.addEventListener("close", (event: CloseEvent) => {
      setConnectionStatus("Closed");
      setReadyState(socket.current?.readyState ?? -1);
      console.log("WebSocket connection closed:", event);
    });

    window.addEventListener("beforeunload", () => {
        socket.current?.send(JSON.stringify({ type: "disconnect" }));
        socket.current?.close();
      });

      return () => socket.current?.close();
  }, [user]);

  const sendMessage = useCallback((message: string, chatId: number) => {
    console.log("Sending WebSocket message:", message, "readyState:", socket.current?.readyState);
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: "chat", content: message, chatId: chatId, id:crypto.randomUUID(), timestamp:Date.now() }));
    } else {
      console.error("WebSocket is not open.");
    }
  },[]);

  return { sendMessage, lastMessage, connectionStatus, readyState};
}
