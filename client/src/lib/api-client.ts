export async function handleResponse<T>(response: Response): Promise<T | undefined> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.text();
      if (errorData) {
        const parsed = JSON.parse(errorData);
        errorMessage = parsed.message || errorMessage;
      }
    } catch {
      // Если парсинг не удался — оставляем default
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined;
  }
  const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return undefined;
}

export function createApiClient() {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
  return {
    request: async <T>(endpoint: string, opts: RequestInit = {}) => {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url  = `${base}${path}`;
      const res  = await fetch(url, { ...opts, credentials: 'include' });
      return handleResponse<T>(res);
    },
  };
}
export const apiClient = createApiClient();
