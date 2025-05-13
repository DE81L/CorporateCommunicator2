import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from './util/logger';
import apiRouter from './routes/api';
import authRouter from './routes/auth';

export function createApp(): Express {
  const app: Express = express();
  app.use(cors({
    origin: ['http://localhost:5173', 'app://.*'],
    credentials: true
  }));
  app.use(express.json());
  
  app.use('/api', apiRouter);
  app.use('/api/auth', authRouter);
  
  // catch all unmatched routes
  app.all('*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}