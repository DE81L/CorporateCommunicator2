import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { logger } from './util/logger';
import apiRouter from './routes/api';
import authRouter from './routes/auth';
import pinoHttp from 'pino-http';
import session from 'express-session';




export function createApp(): Express {
  
  const app: Express = express();
  app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',  // лучше хранить в .env
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,        // true, если используете HTTPS
    httpOnly: true,
    sameSite: 'lax'       // или 'strict'/'none' по необходимости
  }
}));
  app.use(pinoHttp({ logger })); 
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(cors({
    origin: ['http://localhost:5173', 'app://.*'],
    credentials: true
  }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });
  app.use('/api', apiRouter);
  app.use('/api', authRouter);
  
  // catch all unmatched routes
  app.all('*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
