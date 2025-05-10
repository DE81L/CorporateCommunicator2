"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryClient = void 0;
const react_query_1 = require("@tanstack/react-query");
/**
 * Универсальный fetch-по-URL.
 * Работает и в браузере, и внутри Electron, потому что
 * сервер у нас всегда на http://localhost:3000, а в проде URL прописан
 * в .env => VITE_API_URL
 */
async function defaultQueryFn({ queryKey }) {
    const url = queryKey[0];
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok)
        throw new Error(`GET ${url} — ${res.status}`);
    return res.json();
}
exports.queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            queryFn: defaultQueryFn,
            staleTime: 60000,
            refetchOnWindowFocus: false,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
