import { getOwnerKey } from '../lib/ownerKey';
import { OWNER_KEY_HEADER } from './headers';
import type { ApiErrorCode, ApiErrorResponse } from './types';

export class ApiError extends Error {
  readonly status: number;
  /** Set only for the failures the UI has to handle rather than just show. */
  readonly code: ApiErrorCode | undefined;

  constructor(message: string, status: number, code?: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** The route is owner-only and this browser has not unlocked it. */
export function isLocked(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'locked';
}

/** No YouTube channel has been connected through OAuth yet. */
export function isNotConnected(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'not_connected';
}

/**
 * Single entry point for talking to this app's own backend.
 *
 * Every call is same-origin (`/api/...`) — no base URL, no API key. Components
 * never call fetch directly; they go through a hook, which goes through here.
 * That keeps error handling consistent in one place, and means the owner key is
 * attached in exactly one place rather than at every call site.
 */
export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  // An explicit header wins, which is what lets the unlock form verify a key
  // before storing it.
  const ownerKey = getOwnerKey();
  if (ownerKey !== null && !headers.has(OWNER_KEY_HEADER)) {
    headers.set(OWNER_KEY_HEADER, ownerKey);
  }

  const response = await fetch(path, { ...init, headers });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let code: ApiErrorCode | undefined;
    try {
      const body = (await response.json()) as Partial<ApiErrorResponse>;
      if (body.error) message = body.error;
      code = body.code;
    } catch {
      // Body was not JSON (a proxy error page, say) — keep the generic message.
    }
    throw new ApiError(message, response.status, code);
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
