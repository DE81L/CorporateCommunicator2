import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // общий «ленивый» fetcher:
            queryFn: async ({ queryKey }) => {
                const url = queryKey[0] as string;
                const r = await fetch(url, { credentials: "include" });
                if (!r.ok) throw new Error(`GET ${url} — ${r.status}`);
                return r.json();
            },
            staleTime: 60_000,
        },
    },
});




  return {
    request: async (method: string, path: string, body?: unknown): Promise<Response> => {
      const base = getBaseUrl();
      const url = `${base}${path}`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP error! Status: ${response.status}`);
      }

      return response;
    },
  };
}

export function getQueryFn<T = unknown>(path: string) {

   return async (): Promise<T> => {
    // Определяем, запущено ли приложение в Electron
    const isElectron = Boolean((window as any).electron);
    const apiClient = createApiClient(isElectron);
    try {
      const response = await apiClient.request("GET", path);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [path] = queryKey as [string];
        return getQueryFn(path)();
      },
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
