// server/src/ws.ts
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import session from 'express-session';
import { logger } from './util/logger';

// Переменная для хранения инстанса WSS
let wss: WebSocketServer;

/**
 * Инициализирует WebSocketServer на уже созданном HTTP-сервере.
 * Поднимает ws на пути /ws с проверкой сессии.
 */
export function initWebSocket(server: http.Server, sessionMiddleware: session.SessionMiddleware) {
  // Создаём WSS без собственного слушателя порта
  wss = new WebSocketServer({ noServer: true, path: '/ws' });

  // Обрабатываем upgrade-запросы (WebSocket handshake)
  server.on('upgrade', (request, socket, head) => {
    // Прогоняем через sessionMiddleware, чтобы request.session был заполнен
    sessionMiddleware(request as any, {} as any, () => {
      const sid = (request as any).session.userId;
      if (!sid) {
        logger.warn('WS upgrade without session, destroying socket');
        socket.destroy();
        return;
      }
      // Делаем «апгрейд» соединения в WebSocket
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
  });

  // На входе в сокет просто логируем подключение
  wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
    const userId = (request as any).session.userId;
    logger.info(`WS connected: user ${userId}`);
    ws.on('close', () => logger.info(`WS disconnected: user ${userId}`));
  });

  logger.info('WebSocketServer initialized on /ws');
}

/**
 * Рассылает всем подключённым WS-клиентам сообщение о смене статуса.
 */
export function broadcastStatus(userId: number, isonline: 0 | 1) {
  if (!wss) return;
  const msg = JSON.stringify({
    type: 'user-status',
    payload: { userId, isonline },
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}