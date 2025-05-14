import { createApiClient } from '@/lib/api-client';

const { request } = createApiClient();

export const api = {
  get: <T = unknown>(url: string) => request<T>(url),
  post: <T = unknown>(url: string, body?: {}) => request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T = unknown>(url: string, body?: {}) => request<T>(url, { method: "PUT",  body: JSON.stringify(body) }),
  del: <T = unknown>(url: string)        => request<T>(url, { method: "DELETE" }),
};

