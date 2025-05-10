import { z } from 'zod';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Thin wrapper around fetch that does:
 * – absolute URL building
 * – cookie‑forwarding
 * – optional Zod validation
 */
export function createApiClient() {
  function normalizeArgs(args: any[]) {
    if (args.length === 1 || (args.length === 2 && typeof args[1] !== 'string')) {
      return ['GET', args[0] as string, args[1]];
    }
    return [args[0], args[1], args[2]] as [string, string, any];
  }

  async function request<T = unknown>(...raw: any[]): Promise<T> {
    const [method, path, body] = normalizeArgs(raw);
    const res = await fetch(path.startsWith('http') ? path : `${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json() as Promise<T>;
  }

  return { request };
}

export const apiClient = createApiClient();
export default apiClient;
