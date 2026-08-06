import { requireEnv } from './env';

/**
 * Minimal Supabase access over plain HTTP.
 *
 * Supabase exposes every table through PostgREST, a REST API generated from the
 * schema, so `fetch` is enough for the single-row reads and writes this app
 * performs. The official supabase-js client also bundles realtime sockets, auth
 * and storage — none of which we use, and whose open handles hang the function
 * runtime on Windows under `vercel dev`.
 */

export const OWNER_ID = 'owner';

export interface OAuthTokenRow {
  id: string;
  refresh_token: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  updated_at: string;
}

/** Columns safe to expose outward: never includes a token. */
export interface ConnectionRow {
  id: string;
  updated_at: string;
}

export class SupabaseError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Supabase request failed with ${status}`);
    this.name = 'SupabaseError';
    this.status = status;
  }
}

function restUrl(path: string): string {
  return `${requireEnv('SUPABASE_URL').replace(/\/+$/, '')}/rest/v1/${path}`;
}

/**
 * The service_role key goes in both headers: `apikey` gets the request past
 * Supabase's gateway, `Authorization` establishes the role that PostgREST runs
 * the query as. Only the second one lets us bypass Row Level Security.
 */
function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function request(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(restUrl(path), init);

  if (!response.ok) {
    // Log the reason for us; the caller returns a generic message, since
    // PostgREST errors can quote column values back at you.
    console.error('[supabase]', response.status, await response.text());
    throw new SupabaseError(response.status);
  }

  return response;
}

async function selectRows<T>(query: string): Promise<T[]> {
  const response = await request(query, { method: 'GET', headers: authHeaders() });
  return (await response.json()) as T[];
}

/** The full token row, or null when the channel has never been connected. */
export async function getTokenRow(): Promise<OAuthTokenRow | null> {
  const rows = await selectRows<OAuthTokenRow>(
    `oauth_tokens?id=eq.${OWNER_ID}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

/**
 * Connection state without fetching any token.
 *
 * Selecting only these two columns means the secrets never even leave the
 * database for this call — the cheapest possible way to guarantee they cannot
 * leak toward the browser.
 */
export async function getConnectionRow(): Promise<ConnectionRow | null> {
  const rows = await selectRows<ConnectionRow>(
    `oauth_tokens?id=eq.${OWNER_ID}&select=id,updated_at&limit=1`,
  );
  return rows[0] ?? null;
}

export interface TokenRowInsert {
  refresh_token: string;
  access_token: string;
  access_token_expires_at: string;
  updated_at: string;
}

/** Insert the row, or overwrite it if one already exists. */
export async function upsertTokenRow(values: TokenRowInsert): Promise<void> {
  await request('oauth_tokens', {
    method: 'POST',
    headers: authHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({ id: OWNER_ID, ...values }),
  });
}

export async function updateTokenRow(
  patch: Partial<Omit<OAuthTokenRow, 'id'>>,
): Promise<void> {
  await request(`oauth_tokens?id=eq.${OWNER_ID}`, {
    method: 'PATCH',
    headers: authHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify(patch),
  });
}

export async function deleteTokenRow(): Promise<void> {
  await request(`oauth_tokens?id=eq.${OWNER_ID}`, {
    method: 'DELETE',
    headers: authHeaders({ Prefer: 'return=minimal' }),
  });
}
