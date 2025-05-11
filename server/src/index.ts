import { resolve } from 'path';
console.log('Resolved @shared/logger path:', require.resolve('@shared/logger'));

import app from './app';
import { logger } from "@shared/logger";

const PORT = Number(process.env.PORT) || 3000;

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.listen(PORT, () => {
  console.log(`🚀  API ready → http://localhost:${PORT}`);
});