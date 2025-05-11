import { log } from './logger';

export function Trace(
  _target: unknown,
  key: string,
  descriptor: TypedPropertyDescriptor<any>
) {
  const original = descriptor.value!;
  descriptor.value = function (...args: unknown[]) {
    log(`→ ${key}(${args.map(a => JSON.stringify(a)).join(', ')})`);
    const result = original.apply(this, args);
    if (result instanceof Promise) {
      return result.then((r: unknown) => {
        log(`← ${key} ▸ ${stringify(r)}`);
        return r;
      });
    }
    log(`← ${key} ▸ ${stringify(result)}`);
    return result;
  };
}

function stringify(v: unknown) {
  try { return JSON.stringify(v); } catch { return String(v); }
}
