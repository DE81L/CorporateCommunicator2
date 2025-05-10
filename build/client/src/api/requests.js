"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequests = getRequests;
exports.completeRequest = completeRequest;
// Grab a list that belongs to the logged-in user.
// We keep cookies/auth headers by passing credentials: 'include'.
async function getRequests() {
    const res = await fetch('/api/requests', { credentials: 'include' });
    if (!res.ok) {
        // bubble a readable error – react-query/react-error-boundary will love you
        throw new Error(`GET /api/requests failed: ${res.status}`);
    }
    return res.json();
}
// Handy helper you can use elsewhere if you want to mark a request “done”.
async function completeRequest(requestId, payload) {
    const res = await fetch(`/api/requests/${requestId}/complete`, {
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
