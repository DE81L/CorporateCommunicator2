export const log = (...args: unknown[]) => {
  if (process.env.LOG_LEVEL === 'debug') {
    console.log('[DEBUG]', ...args);
  }
};

export const callLog = (...args: unknown[]) => {
  console.log('[call]', ...args);
};