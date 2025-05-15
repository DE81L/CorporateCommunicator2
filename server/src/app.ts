import express, {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import session from 'express-session';
import cors from 'cors';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import { logger } from './util/logger';
import authRouter from './routes/auth';
import apiRouter from './routes/api';
import { isAuthenticated } from './middleware/auth';

export function createApp(): Express {
  const app: Express = express();

  /* ───────── SESSIONS ───────── */
  const sess = session({
    secret: process.env.SESSION_SECRET ?? 'dev‑secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: 'lax' },
  });
  app.use(sess);
  app.set('session-middleware', sess as RequestHandler);

  /* ───────── COMMON MIDDLEWARE ───────── */
  app.use(pinoHttp({ logger: logger as any }));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(
    cors({
      origin: ['http://localhost:5173', 'app://.*'],
      credentials: true,
    }),
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () =>
      logger.info(
        `${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start} ms)`,
      ),
    );
    next();
  });

  /* ───────── PUBLIC END‑POINTS ───────── */
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/hello', (_req, res) => res.json({ message: 'Hello 👋' }));

  /* ───────── AUTH & PROTECTED ROUTES ───────── */
  app.use('/api', authRouter);                 // /api/auth/login, /api/auth/logout, …
  app.use('/api', isAuthenticated, apiRouter); // всё остальное

  /* ───────── 404 FALLBACK ───────── */
  app.all('*', (_req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}
