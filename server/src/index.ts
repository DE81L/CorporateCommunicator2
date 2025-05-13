import "dotenv/config";
import { resolve } from 'path';
import { createApp } from './app';
import { logger } from "@shared/logger";

const PORT = Number(process.env.PORT) || 3000;
const app = createApp();

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.listen(PORT, () => {
  console.log(`🚀  API ready → http://localhost:${PORT}`);
});