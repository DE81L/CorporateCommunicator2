import { logger, preview } from './logger';

export function Trace(
  _target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value!;
  descriptor.value = function (...args: unknown[]) {
    logger.debug({ args: preview(args) }, `${propertyKey} called`);
    const res = original.apply(this, args);
    if (res instanceof Promise) {
      return res
        .then((r: unknown) => {
          logger.debug({ result: preview(r) }, `${propertyKey} resolved`);
          return r;
        })
        .catch((e: unknown) => {
          logger.error({ err: e }, `${propertyKey} rejected`);
          throw e;
        });
    }
    logger.debug({ result: preview(res) }, `${propertyKey} returned`);
    return res;
  };
}
