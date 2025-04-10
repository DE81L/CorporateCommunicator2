import { useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth"; // Import from the correct file
import { useElectron } from "./use-electron";

export function useWebSocket() {
  const { user } = useAuth();
  const { isElectron } = useElectron();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const base = isElectron ? new URL(import.meta.env.VITE_API_URL).host : window.location.host;
    const wsUrl = `${protocol}//${base}/ws`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      console.log("WebSocket connected");
      // Additional onopen logic can be added here
    });

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);
        // Process the incoming data as needed
      } catch (error) {
        console.error("Error parsing WebSocket message", error);
      }
    });

    socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      // Handle WebSocket errors here
    });

    socket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event.reason);
      // Optionally attempt reconnection or cleanup here
    });
    
    return () => {
      socket.close();
    };
  }, [user, isElectron]);

  // ... rest of hook implementation
}