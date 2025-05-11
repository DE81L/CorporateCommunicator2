import { createApiClient } from '@/lib/api-client';
const { request } = createApiClient();
export const api = {
    get: (url) => request(url),
    post: (url, body) => request('POST', url, body),
    put: (url, body) => request('PUT', url, body),
    del: (url) => request('DELETE', url),
};
