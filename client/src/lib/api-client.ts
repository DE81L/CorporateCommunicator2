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
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  return {
    request: async <T>(endpoint: string, options: RequestInit = {}): Promise<T | null> => {
      const fullUrl = `${baseURL}${endpoint}`;
      // Включаем credentials: include по умолчанию
      const fetchOptions: RequestInit = {
        ...options,
        credentials: 'include',
      };
      const response = await fetch(fullUrl, fetchOptions);
      const data = await handleResponse<T>(response);
      return (data === undefined ? null : data) as T;
    }
  };
}

// Экспортируем экземпляр с включёнными куки
export const apiClient = createApiClient();
