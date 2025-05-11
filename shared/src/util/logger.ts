import { Logger } from "tslog";

export const logger = new Logger({
  name: "ccnew",
  displayFilePath: "hidden",
  minLevel: process.env.NODE_ENV === "production" ? 3 : 1,
});

export function logCall<T extends (...args: any[]) => any>(fn: T, name = fn.name): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    logger.debug(`→ ${name}`, { args });
    try {
      const res = fn(...args);
      if (res instanceof Promise) {
        return res.then((val) => {
          logger.debug(`← ${name}`, { result: val });
          return val as ReturnType<T>;
        });
      }
      logger.debug(`← ${name}`, { result: res });
      return res;
    } catch (err) {
      logger.error(`× ${name}`, { err });
      throw err;
    }
  }) as T;
}

export const withTimer = <T extends (...args: any[]) => unknown>(
  fn: T
): ReturnType<T> => {
  const start = performance.now();
  // @ts-expect-error – either sync or async, let the caller await if needed
  const result = fn();
  logger.info(`took ${performance.now() - start}ms`);
  return result as ReturnType<T>;
};
