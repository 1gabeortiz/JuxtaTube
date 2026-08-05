import type { ApiErrorResponse } from './types';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Single entry point for talking to this app's own backend.
 *
 * Every call is same-origin (`/api/...`) — no base URL, no API key, no auth
 * header. Components never call fetch directly; they go through a hook, which
 * goes through here. That keeps error handling consistent in one place.
 */
export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as Partial<ApiErrorResponse>;
      if (body.error) message = body.error;
    } catch {
      // Body was not JSON (a proxy error page, say) — keep the generic message.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function postJson<T>(path: string, body?: unknown): Promise<T> {
  return fetchJson<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}
