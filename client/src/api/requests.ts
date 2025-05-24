import type { Request } from '@/pages/requests-section';
import { createApiClient } from '@/lib/api-client';

const api = createApiClient();

// Grab a list that belongs to the logged-in user.
// We keep cookies/auth headers by passing credentials: 'include'.
export async function getRequests(): Promise<Request[]> {
  return (await api.request<Request[]>('/requests')) ?? [];
}

// Mark request as taken by current user
export async function acceptRequest(requestId: number) {
  return api.request(`/requests/${requestId}/accept`, { method: 'PATCH' });
}

// Handy helper you can use elsewhere if you want to mark a request “done”.
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
