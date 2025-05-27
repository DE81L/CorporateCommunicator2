import pino, { Logger } from 'pino';

export const logger: Logger = pino({
  // Default to info to avoid overwhelming logs unless LOG_LEVEL=debug is set
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
});
export const log = logger.info.bind(logger);
export const callLog = (...args: unknown[]) => {
  logger.info('[call]', ...args);
};
