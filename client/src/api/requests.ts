import type { Request } from '@/pages/requests-section';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// Grab a list that belongs to the logged-in user.
// We keep cookies/auth headers by passing credentials: 'include'.
export async function getRequests() {
  return [];             // TODO: подключить позже
}

// Handy helper you can use elsewhere if you want to mark a request “done”.
export async function completeRequest(
  requestId: number,
  payload: { grade?: number; reviewText?: string }
) {
  const res = await fetch(`${BASE}/api/requests/${requestId}/complete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`PATCH /api/requests/${requestId}/complete failed: ${res.status}`);
  }
  return res.json();
}
