import pino from 'pino';

const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

export function trace<T extends (...args: any[]) => any>(
  fnName: string,
  fn: T,
): T {
  return (async (...args: Parameters<T>) => {
    logger.debug({ fn: fnName, stage: 'enter', args });
    try {
      const result = await fn(...args);
      logger.debug({ fn: fnName, stage: 'exit', result });
      return result;
    } catch (err) {
      logger.error({ fn: fnName, stage: 'error', err });
      throw err;
    }
  }) as T;
}
