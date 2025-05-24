// server/src/ws.ts
import http from 'http';
import type { IncomingMessage } from 'http';
import type { RequestHandler } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './util/logger';
import { db } from './db';

// Сервер + карта подключений userId → Set<ws>
let wss: WebSocketServer;
const connections = new Map<number, Set<WebSocket>>();

export function initWebSocket(
  server: http.Server,
  sessionMiddleware: RequestHandler // Тип RequestHandler из express
): void {
  wss = new WebSocketServer({ noServer: true, path: '/ws' }); // Убедись, что path: '/ws' соответствует VITE_WS_URL
  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    logger.debug(
      `WS upgrade request from ${req.socket.remoteAddress ?? 'unknown'}`
    );
    // Засейвить сессию в req.session
    sessionMiddleware(req as any, {} as any, () => {
      const userId = (req as any).session?.userId as number | undefined;
      if (!userId) {
        logger.warn('WS upgrade без аутентифицированной сессии — отклоняю');
        wss.handleUpgrade(req, socket, head, (ws) => {
          ws.close(4401, 'Unauthorized');
        });
        return;
      }
      logger.debug(`WS upgrade success for user ${userId}`);
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    });
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Нужно снова получить userId из сессии, если она была корректно привязана
    const userId = (req as any).session?.userId as number;
    if (!userId) {
      logger.warn('WS connection без userId в сессии после upgrade.');
      ws.close();
      return;
    }
    if (!connections.has(userId)) connections.set(userId, new Set());
    const set = connections.get(userId)!;
    set.add(ws);
    const first = set.size === 1;
    logger.info(
      `🟢 WS connected: user ${userId} from ${req.socket.remoteAddress ?? 'unknown'}`
    );
    if (first) {
      db!.query('UPDATE users SET isonline = 1 WHERE id = $1', [userId])
        .then(() => broadcastStatus(userId, 1))
        .catch((e) => logger.error('Set online failed:', e));
    }

    // Обработка входящих сообщений
    ws.on('message', (data) => {
      let msg: any;
      try {
        msg = JSON.parse(data.toString());
        if (msg.type === 'p2p-signal') {
          logger.debug(
            `WS p2p-signal from ${userId} to ${(msg.payload as any).to}`
          );
        } else {
          logger.debug(`WS message from ${userId}: ${data}`);
        }
        if (msg.type === 'p2p-signal') {
          const { to, signal } = msg.payload as { to: number; signal: any };
          const targets = connections.get(to);
          if (targets?.size) {
            logger.debug(`Forwarding p2p-signal from ${userId} to ${to}`);
            targets.forEach((target) => {
              if (target.readyState === WebSocket.OPEN) {
                target.send(
                  JSON.stringify({
                    type: 'p2p-signal',
                    payload: { from: userId, signal },
                  })
                );
              }
            });
          } else {
            logger.debug(`Target ${to} not connected for p2p-signal`);
          }
        } else if (msg.type === 'call-request') {
          const { to, callType, fromName } = msg.payload as {
            to: number;
            callType: 'video' | 'audio';
            fromName: string;
          };
          const targets = connections.get(to);
          if (targets?.size) {
            targets.forEach((target) => {
              if (target.readyState === WebSocket.OPEN) {
                target.send(
                  JSON.stringify({
                    type: 'call-request',
                    payload: { from: userId, fromName, callType },
                  })
                );
              }
            });
          } else {
            logger.debug(`Target ${to} not connected for call-request`);
          }
        } else if (msg.type === 'call-accept' || msg.type === 'call-reject') {
          const { to } = msg.payload as { to: number };
          const targets = connections.get(to);
          if (targets?.size) {
            targets.forEach((target) => {
              if (target.readyState === WebSocket.OPEN) {
                target.send(
                  JSON.stringify({
                    type: msg.type,
                    payload: { from: userId },
                  })
                );
              }
            });
          } else {
            logger.debug(`Target ${to} not connected for ${msg.type}`);
          }
        }
      } catch (err) {
        logger.warn('WS message parse error:', err);
      }
    });

    ws.on('close', (code, reason) => {
      const set = connections.get(userId);
      set?.delete(ws);
      const last = !set || set.size === 0;
      if (last) connections.delete(userId);
      logger.info(
        `🔴 WS disconnected: user ${userId} code=${code} reason=${reason.toString()}`
      );
      if (last) {
        db!.query('UPDATE users SET isonline = 0 WHERE id = $1', [userId])
          .then(() => broadcastStatus(userId, 0))
          .catch((e) => logger.error('Set offline failed:', e));
      }
    });

    ws.on('error', (err) => {
      logger.error(`WS error for user ${userId}:`, err);
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
): boolean {
  const targets = connections.get(receiverId);
  if (targets && targets.size > 0) {
    logger.debug(`Sending chat message from ${message.senderId} to ${receiverId}`);
    targets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'chat', payload: message }));
      }
    });
    return true;
  }

  logger.debug(`Chat recipient ${receiverId} offline, skipping WS send`);
  return false;
}

