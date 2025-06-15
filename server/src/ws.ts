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

export function sendToUser(id: number, message: any): boolean {
  const targets = connections.get(id);
  if (!targets || targets.size === 0) return false;
  const data = JSON.stringify(message);
  targets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  });
  return true;
}

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
          logger.debug(`Forwarding p2p-signal from ${userId} to ${to}`);
          if (!sendToUser(to, {
            type: 'p2p-signal',
            payload: { from: userId, signal },
          })) {
            logger.debug(`Target ${to} not connected for p2p-signal`);
          }
        } else if (msg.type === 'call-request') {
          const { to, callType, fromName } = msg.payload as {
            to: number; callType: 'video' | 'audio'; fromName: string;
          };
          sendToUser(to, { type: 'call-request', payload: { from: userId, fromName, callType } });
        } else if (msg.type === 'call-accept') {
          const { to } = msg.payload as { to: number };
          sendToUser(to, { type: 'call-accept', payload: { from: userId } });
        } else if (msg.type === 'call-reject') {
          const { to } = msg.payload as { to: number };
          sendToUser(to, { type: 'call-reject', payload: { from: userId } });
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
 * Broadcast notification that a group was created
 */
export function broadcastGroupCreated(group: any): void {
  if (!wss) return;
  const msg = JSON.stringify({
    type: 'group-created',
    payload: group,
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
  message: any,
): boolean {
  if (process.env.NO_NODE_WS) {
    const wsUrl = process.env.VITE_WS_URL || 'ws://localhost:8001/ws';
    const base = wsUrl.replace(/^ws/, 'http').replace(/\/ws$/, '');
    fetch(`${base}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: receiverId, message }),
    }).catch((err) => logger.error('pyws chat send failed:', err));
    return false;
  } else {
    const ok = sendToUser(receiverId, {
      type: 'chat',
      payload: message,
    });
    if (!ok) {
      logger.debug(`Chat recipient ${receiverId} offline, skipping WS send`);
    } else {
      logger.debug(`Sending chat message from ${message.senderId} to ${receiverId}`);
    }
    return ok;
  }
}

/**
 * Broadcast group message to multiple recipients
 */
export function sendGroupMessage(
  receiverIds: number[],
  message: any,
): number[] {
  if (process.env.NO_NODE_WS) {
    const wsUrl = process.env.VITE_WS_URL || 'ws://localhost:8001/ws';
    const base = wsUrl.replace(/^ws/, 'http').replace(/\/ws$/, '');
    fetch(`${base}/group-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: receiverIds, message }),
    }).catch((err) => logger.error('pyws group send failed:', err));
    return [];
  } else {
    const delivered: number[] = [];
    for (const id of receiverIds) {
      if (sendChatMessage(id, message)) {
        delivered.push(id);
      }
    }
    return delivered;
  }
}

