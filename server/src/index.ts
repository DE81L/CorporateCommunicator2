// server/src/index.ts
import "./config/env";
import * as http from "http";
import { createApp } from "./app";
import { connectDb, resetAllOnlineStatus } from "./db";
import { config } from "./config/env";
import { logger } from "./util/logger";
import { initWebSocket } from "./ws";

async function main() {
  await connectDb();
  await resetAllOnlineStatus();

  const { app, sessionMiddleware } = createApp();

  // Оборачиваем Express в HTTP-сервер
  const server = http.createServer(app);

  // Инициализируем WS сессией
  initWebSocket(server, sessionMiddleware);

  server.listen(config.port, () => {
    logger.info(`🚀 Server ready on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
