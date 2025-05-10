import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'debug',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { singleLine: true } }
    : undefined,
});

export const preview = (v: unknown) =>
  typeof v === 'string' ? v.slice(0, 120) :
  typeof v === 'object' ? JSON.stringify(v).slice(0,120) : v;
