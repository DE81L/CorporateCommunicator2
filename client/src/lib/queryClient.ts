import { QueryClient } from '@tanstack/react-query';

/**
 * Универсальный fetch-по-URL.
 * Работает и в браузере, и внутри Electron, потому что
 * сервер у нас всегда на http://localhost:3000, а в проде URL прописан
 * в .env => VITE_API_URL
 */
async function defaultQueryFn({ queryKey }: { queryKey: readonly unknown[] }) {
  const url = queryKey[0] as string;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`GET ${url} — ${res.status}`);
  return res.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
