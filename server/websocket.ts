import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { storage } from './storage';

export interface WebSocketHub {
  wss: WebSocketServer;
  clients: Map<number, WebSocket>;
}

export function setupWebSocket(server: Server): WebSocketHub {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'  // Explicitly set the WebSocket path
  });
  const clients = new Map<number, WebSocket>();

  // Set up heartbeat interval
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
      if (ws.isAlive === false) {
        const userId = Array.from(clients.entries())
          .find(([, client]) => client === ws)?.[0];
        if (userId) {
          clients.delete(userId);
          storage.updateUserOnlineStatus(userId, false);
        }
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return { wss, clients };
}
