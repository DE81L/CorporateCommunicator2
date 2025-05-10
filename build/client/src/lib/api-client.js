"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiClient = createApiClient;
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
/**
 * Thin wrapper around fetch that does:
 * – absolute URL building
 * – cookie‑forwarding
 * – optional Zod validation
 */
function createApiClient() {
    async function request(path, opts = {}, schema) {
        const res = await fetch(`${BASE}${path}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            ...opts,
        });
        if (!res.ok) {
            throw new Error(`${res.status} ${res.statusText}`);
        }
        const data = (await res.json());
        return schema ? schema.parse(data) : data;
    }
    return { request };
}
