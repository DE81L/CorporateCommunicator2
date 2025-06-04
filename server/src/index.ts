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

async function main() {
  await connectDb();
  await ensureIsExplanationColumn();
  await resetAllOnlineStatus();
  scheduleMessageCleanup();

  const { app, sessionMiddleware } = createApp();

  // Оборачиваем Express в HTTP-сервер
  const server = http.createServer(app);

  // Инициализируем WS сессией, если не выключено флагом
  if (!process.env.NO_NODE_WS) {
    initWebSocket(server, sessionMiddleware);
  } else {
    logger.info('NO_NODE_WS set, skipping built-in WebSocket server');
  }

  server.listen(config.port, () => {
    logger.info(`🚀 Server ready on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
