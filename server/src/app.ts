import express, {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import cors from 'cors';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import { logger } from './util/logger';
import authRouter from './routes/auth';
import apiRouter from './routes/api';
import { isAuthenticated } from './middleware/auth';
import path from 'path';

export interface AppInit {
  app: Express;
  sessionMiddleware: RequestHandler;
}

export function createApp(): AppInit {
  const app: Express = express();

  // Disable ETag to avoid 304 responses which break simple fetch helpers
  app.set('etag', false);

  /* ───────── SESSIONS ───────── */
  const PgSession = connectPgSimple(session);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const store = new PgSession({
    pool,
    tableName: 'session',
    ttl: 7 * 24 * 60 * 60,
  });
  const cookieDomain = process.env.COOKIE_DOMAIN;
  const sess = session({
    store,
    secret: process.env.SESSION_SECRET ?? 'dev‑secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    },
  });
  app.use(sess);
  app.set('session-middleware', sess as RequestHandler);

  /* ───────── COMMON MIDDLEWARE ───────── */
  app.use(pinoHttp({ logger: logger as any, autoLogging: false }));
  app.use(morgan('dev'));
  // Increase JSON body size limit to handle batched messages
  app.use(express.json({ limit: '5mb' }));
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
        `${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start} ms)`,
      ),
    );
    next();
  });

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

/* ───────── PUBLIC END-POINTS ───────── */
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/hello', (_req, res) => res.json({ message: 'Hello 👋' }));

  /* ───────── AUTH & PROTECTED ROUTES ───────── */
  app.use('/api', authRouter);                 // /api/auth/login, /api/auth/logout, …
  app.use('/api', isAuthenticated, apiRouter); // всё остальное

  /* ───────── 404 FALLBACK ───────── */
  app.all('*', (_req, res) => res.status(404).json({ error: 'Not found' }));

  return { app, sessionMiddleware: sess as RequestHandler };
}
