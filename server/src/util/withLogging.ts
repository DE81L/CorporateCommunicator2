import { logger } from './logger';

export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  name = fn.name || 'anonymous'
): T {
  return (function (...args: Parameters<T>): ReturnType<T> {
    logger.debug({ name, args }, '→ call');
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result
          .then(r => (logger.debug({ name, result: r }, '← resolve'), r))
          .catch(e => (logger.error({ name, err: e }, '← reject'), Promise.reject(e))) as ReturnType<T>;
      }
      logger.debug({ name, result }, '← return');
      return result;
    } catch (err) {
      logger.error({ name, err }, '← throw');
      throw err;
    }
  }) as unknown as T;
}
