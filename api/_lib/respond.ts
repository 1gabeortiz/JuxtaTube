import type { ApiErrorCode, ApiErrorResponse } from '../../src/api/types.js';
import { MissingEnvError } from './env.js';
import { NotConnectedError } from './getAccessToken.js';
import { OAuthError } from './googleOAuth.js';
import { SupabaseError } from './postgrest.js';
import { UnauthorizedError } from './requireOwner.js';
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
 * Success response for owner-only data, cacheable by the browser but never by a
 * shared cache.
 *
 * This distinction is the whole reason the helper exists. `jsonOk` sets
 * s-maxage, which tells Vercel's CDN to store the response and serve it to
 * anyone who requests the same URL. Since the owner check reads a request
 * header and the CDN keys its cache on the URL alone, an authorized request
 * would populate the cache and the next unauthenticated visitor would be handed
 * private analytics without the function ever running. `private` forbids the
 * shared cache from storing it at all, while max-age still spares the quota on
 * the owner's own repeat views.
 */
export function jsonPrivate(data: unknown, seconds = 600): Response {
  return Response.json(data, {
    headers: { 'Cache-Control': `private, max-age=${seconds}` },
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

export function jsonError(
  message: string,
  status: number,
  code?: ApiErrorCode,
): Response {
  const body: ApiErrorResponse = code ? { error: message, code } : { error: message };
  // no-store because an error is specific to this request. A cached 401 would
  // keep being served after the user unlocks owner mode.
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
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

  if (error instanceof UnauthorizedError) {
    return jsonError(error.message, 401, 'locked');
  }

  // 409 rather than 401: the request was well-formed, the app just has no
  // stored connection yet. The UI uses this to show the Connect button.
  if (error instanceof NotConnectedError) {
    return jsonError(
      'Channel is not connected. Connect it to load this data.',
      409,
      'not_connected',
    );
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
