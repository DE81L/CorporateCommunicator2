export function log(...args: any[]): void {
  console.log('[Log]', ...args);
}

export function warn(...args: any[]): void {
  console.warn('[Warn]', ...args);
}

export function error(...args: any[]): void {
  console.error('[Error]', ...args);
}
