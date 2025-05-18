// server/src/ws.ts
import http from 'http';
import type { IncomingMessage } from 'http';
import type { RequestHandler } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './util/logger';

// Сервер + карта подключений userId → ws
let wss: WebSocketServer;
const connections = new Map<number, WebSocket>();

export function initWebSocket(
  server: http.Server,
  sessionMiddleware: RequestHandler // Тип RequestHandler из express
): void {
  wss = new WebSocketServer({ noServer: true, path: '/ws' }); // Убедись, что path: '/ws' соответствует VITE_WS_URL
  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    // Засейвить сессию в req.session
    sessionMiddleware(req as any, {} as any, () => {
      const userId = (req as any).session?.userId as number | undefined;
      if (!userId) {
        logger.warn('WS upgrade без аутентифицированной сессии — отклоняю');
        socket.destroy();
        return;
      }
      logger.debug(`WS upgrade success for user ${userId}`);
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    });
  });

   wss.on('connection', (ws: WebSocket, req: IncomingMessage) => { // req здесь IncomingMessage
    // Нужно снова получить userId из сессии, если она была корректно привязана
    const userId = (req as any).session?.userId as number;
    if (!userId) {
        logger.warn('WS connection без userId в сессии после upgrade.');
        ws.close();
        return;
    }
    connections.set(userId, ws);
    logger.info(`🟢 WS connected: user ${userId}`);

    // Обработка входящих P2P-сигналов
    ws.on('message', (data) => {
      logger.debug(`WS message from ${userId}: ${data}`);
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'p2p-signal') {
          const { to, signal } = msg.payload as { to: number; signal: any };
          const target = connections.get(to);
          if (target?.readyState === WebSocket.OPEN) {
            logger.debug(
              `Forwarding p2p-signal from ${userId} to ${to}`
            );
            target.send(
              JSON.stringify({
                type: 'p2p-signal',
                payload: { from: userId, signal },
              })
            );
          } else {
            logger.debug(`Target ${to} not connected for p2p-signal`);
          }
        }
      } catch (err) {
        logger.warn('WS message parse error:', err);
      }
    });

    ws.on('close', () => {
      connections.delete(userId);
      logger.info(`🔴 WS disconnected: user ${userId}`);
    });
  });

  logger.info('WebSocketServer initialized on /ws');
}

/**
 * Нотификация об изменении статуса
 */
export function broadcastStatus(
  userId: number,
  isonline: 0 | 1
): void {
  if (!wss) return;
  const msg = JSON.stringify({
    type: 'user-status',
    payload: { userId, isonline },
  });
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
}

/**
 * Серверная пересылка “chat” (если оба онлайн)
 */
export function sendChatMessage(
  receiverId: number,
  message: any
): void {
  const ws = connections.get(receiverId);
  if (ws?.readyState === WebSocket.OPEN) {
    logger.debug(
      `Sending chat message from ${message.senderId} to ${receiverId}`
    );
    ws.send(JSON.stringify({ type: 'chat', payload: message }));
  } else {
    logger.debug(`Chat recipient ${receiverId} offline, skipping WS send`);
  }
}
