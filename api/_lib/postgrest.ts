import { requireEnv } from './env.js';

/**
 * Generic access to Supabase tables over PostgREST, the REST API Supabase
 * generates from the schema.
 *
 * Plain `fetch` rather than supabase-js: every operation here is a single-table
 * read or write, and the official client additionally bundles realtime sockets,
 * auth and storage whose open handles hang the function runtime under local
 * development on Windows.
 *
 * `filter` arguments are raw PostgREST query strings, e.g. `id=eq.owner`.
 */

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
 * Supabase's gateway, `Authorization` establishes the role PostgREST runs the
 * query as. Only the second one bypasses Row Level Security.
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
    // Log the reason for us; callers return a generic message, since PostgREST
    // errors can quote column values back at you.
    console.error('[supabase]', response.status, await response.text());
    throw new SupabaseError(response.status);
  }

  return response;
}

export async function selectRows<T>(query: string): Promise<T[]> {
  const response = await request(query, { method: 'GET', headers: authHeaders() });
  return (await response.json()) as T[];
}

export async function insertRows(table: string, values: unknown): Promise<void> {
  await request(table, {
    method: 'POST',
    headers: authHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify(values),
  });
}

/** Insert, or overwrite rows that collide on a unique constraint. */
export async function upsertRows(table: string, values: unknown): Promise<void> {
  await request(table, {
    method: 'POST',
    headers: authHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(values),
  });
}

export async function patchRows(
  table: string,
  filter: string,
  values: unknown,
): Promise<void> {
  await request(`${table}?${filter}`, {
    method: 'PATCH',
    headers: authHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify(values),
  });
}

export async function deleteRows(table: string, filter: string): Promise<void> {
  await request(`${table}?${filter}`, {
    method: 'DELETE',
    headers: authHeaders({ Prefer: 'return=minimal' }),
  });
}
