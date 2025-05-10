import { createApiClient } from '@/lib/api-client';

const { request } = createApiClient();

export const api = {
  get: <T = unknown>(url: string) => request<T>(url),
  post: <T = unknown>(url: string, body?: {}) => request<T>('POST', url, body),
  put: <T = unknown>(url: string, body?: {}) => request<T>('PUT', url, body),
  del: <T = unknown>(url: string) => request<T>('DELETE', url),
};