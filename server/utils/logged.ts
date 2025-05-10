import { logger } from './logger';

export function Logged(
  _target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const fn = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const span = { fn: propertyKey, args };
    logger.info(span, '▶ enter');
    try {
      const result = await fn.apply(this, args);
      logger.info({ ...span, result }, '✔ exit');
      return result;
    } catch (err) {
      logger.error({ ...span, err }, '✖ error');
      throw err;
    }
  };
}
