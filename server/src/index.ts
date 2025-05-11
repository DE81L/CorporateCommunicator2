import app from './app';
import { logger } from "@shared/logger";

const PORT = Number(process.env.PORT) || 3000;

app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

app.listen(PORT, () => {
  console.log(`🚀  API ready → http://localhost:${PORT}`);
});