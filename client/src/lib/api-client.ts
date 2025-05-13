import { z } from 'zod';

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
      // If parsing fails, use the default error message
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return undefined;
}

export function createApiClient(withCredentials = false) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  return {
    request: async <T>(endpoint: string, options: RequestInit = {}): Promise<T | undefined> => {
      const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        credentials: withCredentials ? 'include' : 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      return handleResponse<T>(response);
    }
  };
}

export const apiClient = createApiClient();
