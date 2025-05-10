import pino from 'pino';

export const logger = pino({
  level: 'trace',
  customLevels: { http: 25 },
  useOnlyCustomLevels: false,
  ...(process.env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true }
        }
      }
    : {})
});
