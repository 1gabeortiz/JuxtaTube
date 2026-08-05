import type { ApiErrorResponse } from '../../src/api/types.js';
import { MissingEnvError } from './env.js';
import { NotConnectedError } from './getAccessToken.js';
import { OAuthError } from './googleOAuth.js';
import { SupabaseError } from './supabase.js';
import { AnalyticsApiError } from './youtubeAnalyticsApi.js';
import { YouTubeApiError } from './youtubeDataApi.js';

/**
 * Success response with a caching hint for Vercel's CDN.
 *
 * s-maxage lets the CDN serve a cached copy for `seconds`, and
 * stale-while-revalidate lets it keep serving that copy while it quietly
 * fetches a fresh one. Both matter here because the Data API has a hard
 * 10,000-unit daily quota — cached responses cost zero units.
 */
export function jsonOk(data: unknown, seconds = 600): Response {
  return Response.json(data, {
    headers: {
      'Cache-Control': `s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
    },
  });
}

/**
 * Success response that must never be cached.
 *
 * Connection state changes the instant the owner connects or disconnects. If
 * the CDN cached it, the UI would keep showing a stale "not connected" state
 * for minutes after a successful authorization.
 */
export function jsonNoStore(data: unknown): Response {
  return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

export function jsonError(message: string, status: number): Response {
  const body: ApiErrorResponse = { error: message };
  return Response.json(body, { status });
}

/**
 * Converts a thrown error into a safe HTTP response.
 *
 * Deliberately does not echo the underlying error text to the client: request
 * URLs for the Data API carry the API key as a query parameter, so blindly
 * forwarding error details risks leaking it. Full detail goes to the server
 * log, where only we can read it.
 */
export function toErrorResponse(error: unknown): Response {
  console.error('[api]', error);

  if (error instanceof MissingEnvError) {
    return jsonError('Server is not configured correctly.', 500);
  }

  // 409 rather than 401: the request was well-formed, the app just has no
  // stored connection yet. The UI uses this to show the Connect button.
  if (error instanceof NotConnectedError) {
    return jsonError('Channel is not connected. Connect it to load this data.', 409);
  }

  if (error instanceof OAuthError) {
    return jsonError(error.message, 502);
  }

  if (error instanceof SupabaseError) {
    return jsonError('Could not reach the database.', 502);
  }

  if (error instanceof AnalyticsApiError) {
    if (error.status === 401) {
      return jsonError('Your Google authorization expired. Reconnect the channel.', 401);
    }
    // 403 here almost always means the stored token belongs to a different
    // channel than YT_CHANNEL_ID, or consent was granted without both scopes.
    if (error.status === 403) {
      return jsonError(
        'Google refused this analytics request. The connected account may not ' +
          'own this channel — disconnect and reconnect, choosing the right ' +
          'channel on the consent screen.',
        403,
      );
    }
    return jsonError('YouTube Analytics request failed.', 502);
  }

  if (error instanceof YouTubeApiError) {
    if (error.status === 403) {
      return jsonError('YouTube API quota exceeded or access denied.', 502);
    }
    if (error.status === 404) {
      return jsonError('Requested YouTube resource was not found.', 404);
    }
    return jsonError('YouTube API request failed.', 502);
  }

  return jsonError('Unexpected server error.', 500);
}
