import { requireEnv } from './env.js';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

/**
 * Google Identity Services popup mode delivers the auth code to a JavaScript
 * callback instead of redirecting the browser. For the server-side exchange,
 * Google expects the literal string "postmessage" as redirect_uri.
 *
 * This is load-bearing and undocumented. Passing a real URL here — even one
 * correctly registered in the Cloud Console — fails with redirect_uri_mismatch.
 */
const POPUP_REDIRECT_URI = 'postmessage';

export class OAuthError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'OAuthError';
    this.status = status;
  }
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  /**
   * Only present the first time a user consents. On re-authorization Google
   * often omits it, so never overwrite a stored refresh token with undefined.
   */
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

async function postToTokenEndpoint(
  body: URLSearchParams,
  failureMessage: string,
): Promise<GoogleTokenResponse> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    // Log Google's reason for us; never return it to the client, since the
    // error body can echo request parameters including the client secret.
    console.error('[oauth] token endpoint failed', response.status, await response.text());
    throw new OAuthError(failureMessage, response.status);
  }

  return (await response.json()) as GoogleTokenResponse;
}

export function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  return postToTokenEndpoint(
    new URLSearchParams({
      client_id: requireEnv('VITE_GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      code,
      redirect_uri: POPUP_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
    'Could not exchange the authorization code.',
  );
}

export function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  return postToTokenEndpoint(
    new URLSearchParams({
      client_id: requireEnv('VITE_GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    'Could not refresh the access token — reconnect your channel.',
  );
}

/** Tells Google to invalidate the credential. Best-effort: failure is logged. */
export async function revokeToken(token: string): Promise<void> {
  try {
    const response = await fetch(REVOKE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    });
    if (!response.ok) {
      console.error('[oauth] revoke failed', response.status);
    }
  } catch (error) {
    console.error('[oauth] revoke threw', error);
  }
}
