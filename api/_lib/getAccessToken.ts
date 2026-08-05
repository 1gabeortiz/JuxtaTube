import { refreshAccessToken } from './googleOAuth.js';
import { getTokenRow, updateTokenRow } from './supabase.js';

export class NotConnectedError extends Error {
  constructor() {
    super('Channel is not connected.');
    this.name = 'NotConnectedError';
  }
}

/**
 * Treat a token as expired a minute early. Without this margin a token that is
 * valid at the moment we check can expire while the outbound request is still
 * in flight, producing an intermittent 401 that is miserable to reproduce.
 */
const EXPIRY_SKEW_MS = 60_000;

/**
 * Returns a usable access token, refreshing it silently when needed.
 *
 * Access tokens last about an hour; the refresh token is long-lived. So the
 * owner authorizes once and the app keeps working without any further login —
 * that is the entire point of storing a refresh token.
 */
export async function getValidAccessToken(): Promise<string> {
  const row = await getTokenRow();
  if (!row) {
    throw new NotConnectedError();
  }

  const expiresAt = row.access_token_expires_at
    ? Date.parse(row.access_token_expires_at)
    : 0;

  if (row.access_token && expiresAt - EXPIRY_SKEW_MS > Date.now()) {
    return row.access_token;
  }

  const refreshed = await refreshAccessToken(row.refresh_token);

  await updateTokenRow({
    access_token: refreshed.access_token,
    access_token_expires_at: new Date(
      Date.now() + refreshed.expires_in * 1000,
    ).toISOString(),
    updated_at: new Date().toISOString(),
    // Google usually omits refresh_token when refreshing. Only overwrite when
    // it actually sends a new one, or we would destroy our own credential.
    ...(refreshed.refresh_token ? { refresh_token: refreshed.refresh_token } : {}),
  });

  return refreshed.access_token;
}
