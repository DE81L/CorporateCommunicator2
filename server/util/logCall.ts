import { logger } from './logger';

export function LogCall(
  _target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    logger.debug(`[${propertyKey}] →`, args);
    try {
      const result = await original.apply(this, args);
      logger.debug(`[${propertyKey}] ←`, result);
      return result;
    } catch (e) {
      logger.error(`[${propertyKey}] !`, e);
      throw e;
    }
  };
}

export const loggable = <T extends (...a: any[]) => any>(
  fn: T,
  name = fn.name || 'anon'
): T =>
  (function (...args: any[]) {
    logger.debug(`→ ${name}`, args);
    const out = fn(...args);
    return out instanceof Promise
      ? out.then(r => (logger.debug(`← ${name}`, r), r))
      : (logger.debug(`← ${name}`, out), out);
  }) as T;
