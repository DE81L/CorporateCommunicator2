const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export function createApiClient(includeCredentials = true) {
  type Options = RequestOptions & { body?: unknown };

  // Overload signatures
  async function request<T>(path: string, options?: Options): Promise<T>;
  async function request<T>(method: string, path: string, body?: unknown): Promise<T>;
  
  // Implementation
  async function request<T>(...args: [string, any?, any?]): Promise<T> {
    let path: string;
    let method = 'GET';
    let init: Options = {};

    // Handle path-first style: (path, { method?, ...options })
    if (args[0].startsWith('/')) {
      [path, init] = [args[0], args[1] ?? {}];
      if (init.method) method = init.method;
    }
    // Handle method-first style: (method, path, body?)
    else {
      [method, path, init] = [args[0], args[1], { body: args[2] }];
    }

    const { params, ...rest } = init;
    const searchParams = new URLSearchParams(params);
    const url = `${API_URL}${path}${params ? '?' + searchParams : ''}`;

    const response = await fetch(url, {
      ...rest,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...rest.headers,
      },
      credentials: includeCredentials ? 'include' : 'omit',
      body: init.body ? JSON.stringify(init.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  return { request };
}

// Add singleton export
export const apiClient = createApiClient();











