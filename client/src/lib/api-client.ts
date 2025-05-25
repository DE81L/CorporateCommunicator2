// client/src/lib/api-client.ts
export async function handleResponse<T>(response: Response): Promise<T | undefined> {
  // Считаем 304 Not Modified допустимым пустым ответом
  if (response.status === 304) return undefined;

  if (!response.ok) {
    let msg = `Request failed: ${response.status}`;
    try {
      const text = await response.text();
      if (text) {
        const json = JSON.parse(text);
        msg = json.message ?? msg;
      }
    } catch {
      // игнорируем ошибки парсинга
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
  const base = envBase.endsWith('/api')
    ? envBase
    : `${envBase.replace(/\/+$/, '')}/api`;


  return {
    async request<T>(endpoint: string, opts: RequestInit = {}) {
      let url: string;
      if (/^https?:\/\//.test(endpoint)) {
        url = endpoint;
      } else {
      let path = endpoint;
        if (path.startsWith('/api')) {
          path = path.replace(/^\/api/, '');
        }
      if (!path.startsWith('/')) {
          path = '/' + path;
        }
        url = base + path;
      }
      const res = await fetch(url, { ...opts, credentials: 'include' });
      return handleResponse<T>(res);
    },
  };
}

export const apiClient = createApiClient();
