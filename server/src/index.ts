// server/src/index.ts
import "./config/env";
import http from "http";
import express, { RequestHandler } from "express";
import { createApp } from "./app";
import { connectDb } from "./db";
import { config } from "./config/env";
import { logger } from "./util/logger";
import session from "express-session";
import { initWebSocket } from "./ws";

async function main() {
  await connectDb();

  const app = createApp();

  // Если вы сохраняли session-мидлвэр в app:
  // в createApp():
  //   const sess = session({...});
  //   app.use(sess);
  //   app.set("session-middleware", sess);
  //
  // Здесь просто достаем без неправильного типа:
  const sessionMiddleware = (app as any).get("session-middleware") as RequestHandler;

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
