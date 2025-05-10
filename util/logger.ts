export const log = (...args: unknown[]) => {
  if (process.env.LOG_LEVEL === 'debug') {
    console.log('[DEBUG]', ...args);
  }
};