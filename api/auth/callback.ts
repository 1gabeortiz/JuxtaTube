import { exchangeCodeForTokens } from '../_lib/googleOAuth';
import { jsonError, jsonNoStore, toErrorResponse } from '../_lib/respond';
import { getConnectionRow, updateTokenRow, upsertTokenRow } from '../_lib/supabase';

/**
 * Trades the one-time authorization code from the browser for tokens.
 *
 * The code arrives in the request body, not the URL, so it never lands in
 * server access logs or browser history. The client secret used for the
 * exchange stays on the server, which is the whole reason this route exists
 * instead of the browser doing the exchange itself.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError('Method not allowed.', 405);
  }

  try {
    const body = (await request.json()) as { code?: unknown };
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!code) {
      return jsonError('Missing authorization code.', 400);
    }

    const tokens = await exchangeCodeForTokens(code);
    const now = new Date().toISOString();
    const accessTokenExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString();

    if (tokens.refresh_token) {
      await upsertTokenRow({
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        access_token_expires_at: accessTokenExpiresAt,
        updated_at: now,
      });
      return jsonNoStore({ connected: true });
    }

    // Google only issues a refresh token the first time an account consents.
    // Re-authorizing an already-approved account returns an access token alone,
    // so keep the refresh token already on file rather than wiping it.
    const existing = await getConnectionRow();
    if (!existing) {
      return jsonError(
        'Google did not return a refresh token. Remove JuxtaTube at ' +
          'myaccount.google.com/permissions, then connect again.',
        400,
      );
    }

    await updateTokenRow({
      access_token: tokens.access_token,
      access_token_expires_at: accessTokenExpiresAt,
      updated_at: now,
    });

    return jsonNoStore({ connected: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
