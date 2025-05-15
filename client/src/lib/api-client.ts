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

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return undefined;
}

export function createApiClient(withCredentials = true) {
  // Убираем '/api' из VITE_API_URL и ставим порт 4000 по умолчанию
  const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const baseURL = rawBase.replace(/\/api\/?$/, ''); // strip trailing /api if any

  return {
    request: async <T>(endpoint: string, options: RequestInit = {}): Promise<T | null> => {
      const fullUrl = `${baseURL}${endpoint}`;
      const fetchOptions: RequestInit = {
        ...options,
        credentials: 'include',
      };
      const response = await fetch(fullUrl, fetchOptions);
      return (await handleResponse<T>(response)) as T;
    },
  };
}

// Экспортируем экземпляр с включёнными куки
export const apiClient = createApiClient();
