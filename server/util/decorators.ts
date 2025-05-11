import { logger } from './logger'

export function Log(
  _target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value
  descriptor.value = function (...args: any[]) {
    logger.debug({ args }, `${propertyKey} ↗ called`)
    const result = original.apply(this, args)
    return result instanceof Promise
      ? result.then(r => (logger.debug({ result: r }, `${propertyKey} ↘ resolved`), r))
      : (logger.debug({ result }, `${propertyKey} ↘ returned`), result)
  }
}
