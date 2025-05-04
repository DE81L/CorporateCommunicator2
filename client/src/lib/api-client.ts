const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export function createApiClient(includeCredentials = true) {
  return {
    request: async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
      const { params, ...init } = options;
      
      let url = `${API_URL}${path}`;
      if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
      }

      const response = await fetch(url, {
        ...init,
        credentials: includeCredentials ? 'include' : 'omit',
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    }
  };
}
