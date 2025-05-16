// client/src/lib/api-client.ts
export async function handleResponse<T>(response: Response): Promise<T | undefined> {
  if (!response.ok) {
    let msg = `Request failed: ${response.status}`;
    try {
      const raw = await response.text();
      if (raw) msg = JSON.parse(raw).message ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  if (response.status === 204) return undefined;
  const ct = response.headers.get('content-type');
  return ct?.includes('application/json') ? response.json() : undefined;
}

/**
 *  BASE = VITE_API_URL (+ fallback) **всегда** заканчивается на `/api`
 *  поэтому дальше можно писать просто `/contacts`, `/messages`, … 
 */
export function createApiClient() {
  const envBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const base =
    envBase.endsWith('/api') ? envBase : `${envBase.replace(/\/+$/, '')}/api`;

  return {
    async request<T>(endpoint: string, opts: RequestInit = {}) {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url  = `${base}${path}`;
      const res  = await fetch(url, { ...opts, credentials: 'include' });
      return handleResponse<T>(res);
    },
  };
}

export const apiClient = createApiClient();
