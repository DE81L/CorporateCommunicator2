import { Logger, ISettingsParam } from 'tslog';

const settings: ISettingsParam<unknown> = {
  minLevel: 'info',
};

export const logger = new Logger(settings);

export function wrap<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    return fn(...args);
  };
}
