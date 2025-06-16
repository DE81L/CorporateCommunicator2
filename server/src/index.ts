// server/src/index.ts
import "./config/env";
import * as http from "http";
import { createApp } from "./app";
import { connectDb, resetAllOnlineStatus } from "./db";
import { ensureIsExplanationColumn } from "./db-migrations";
import { config } from "./config/env";
import { logger } from "./util/logger";
import { scheduleMessageCleanup } from "./util/messageCleanup";
import { initWebSocket } from "./ws";

// Если явно не указан USE_NODE_WS, отключаем Node WS
if (!process.env.USE_NODE_WS && !process.env.NO_NODE_WS) {
  console.log(
    '⛔️ Node WS отключён по умолчанию. Установите USE_NODE_WS=1, чтобы включить.'
  );
  process.env.NO_NODE_WS = '1';
}

async function main() {
  await connectDb();
  await ensureIsExplanationColumn();
  await resetAllOnlineStatus();
  scheduleMessageCleanup();

  const { app, sessionMiddleware } = createApp();

  // Оборачиваем Express в HTTP-сервер
  const server = http.createServer(app);

  // Инициализируем WS, только если разрешено переменной USE_NODE_WS
  if (process.env.USE_NODE_WS) {
    initWebSocket(server, sessionMiddleware);
  } else {
    logger.info('Встроенный WebSocket отключён');
  }

  server.listen(config.port, () => {
    logger.info(`🚀 Server ready on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
