import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes';
import { connectDb } from './db';
import pino from 'pino';
import pinoHttp from 'pino-http';

export const app = express();
const logger = pino();

export async function createApp() {
  // core middleware
  app.use(morgan('dev'));
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
  app.use(express.json());

  // HTTP logging middleware
  app.use(pinoHttp({ logger }));

  // debug middleware
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  // routes
  app.use('/api', router);

  // 404
  app.use((_req, res, _next) => { res.status(404).json({ error: 'Not found' }); });

  // error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ message: 'Something blew up' });
  });

  // DB (skipped when DB_DISABLED=true)
  await connectDb();
}

// run directly = start server
if (require.main === module) {
  createApp()
    .then(() => {
      const port = Number(process.env.PORT) || 3000;
      app.listen(port, () =>
        console.log(`🚀  API ready on http://localhost:${port}`)
      );
    })
    .catch((err) => {
      console.error('❌  Failed to start server', err);
      process.exit(1);
    });
}