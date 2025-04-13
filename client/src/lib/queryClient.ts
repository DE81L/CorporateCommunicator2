import { QueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function createApiClient(isElectron: boolean) {
  const getBaseUrl = () => (isElectron ? API_URL : "");

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

      if(path === "/api/user"){
        console.log("response.ok:", response.ok);
        console.log("response:", response);
      }

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
      console.log(`Sending request to: ${path}`);
      const response = await apiClient.request("GET", path);
      console.log(`Received response for ${path}:`, response);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      console.log(`Parsed data for ${path}:`, data);
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
