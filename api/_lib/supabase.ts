import { deleteRows, patchRows, selectRows, upsertRows } from './postgrest.js';

/** Where the owner's Google credentials live. Exactly one row. */

export const OWNER_ID = 'owner';

const TABLE = 'oauth_tokens';
const OWNER_FILTER = `id=eq.${OWNER_ID}`;

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

/** The full token row, or null when the channel has never been connected. */
export async function getTokenRow(): Promise<OAuthTokenRow | null> {
  const rows = await selectRows<OAuthTokenRow>(
    `${TABLE}?${OWNER_FILTER}&select=*&limit=1`,
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
    `${TABLE}?${OWNER_FILTER}&select=id,updated_at&limit=1`,
  );
  return rows[0] ?? null;
}

export interface TokenRowInsert {
  refresh_token: string;
  access_token: string;
  access_token_expires_at: string;
  updated_at: string;
}

export function upsertTokenRow(values: TokenRowInsert): Promise<void> {
  return upsertRows(TABLE, { id: OWNER_ID, ...values });
}

export function updateTokenRow(
  patch: Partial<Omit<OAuthTokenRow, 'id'>>,
): Promise<void> {
  return patchRows(TABLE, OWNER_FILTER, patch);
}

export function deleteTokenRow(): Promise<void> {
  return deleteRows(TABLE, OWNER_FILTER);
}
