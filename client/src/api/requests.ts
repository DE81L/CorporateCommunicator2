import type { Request } from '@/pages/requests-section';
import { createApiClient } from '@/lib/api-client';

const api = createApiClient();

// Получаем список, принадлежащий авторизованному пользователю.
// Куки и заголовки авторизации сохраняем через credentials: 'include'.
export async function getRequests(): Promise<Request[]> {
  return (await api.request<Request[]>('/requests')) ?? [];
}

// Пометить заявку как принятую текущим пользователем
export async function acceptRequest(requestId: number) {
  return api.request(`/requests/${requestId}/accept`, { method: 'PATCH' });
}

// Удобный помощник для пометки заявки как выполненной
export async function completeRequest(
  requestId: number,
  payload: { grade?: number; reviewText?: string }
) {
  return api.request(`/requests/${requestId}/complete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
