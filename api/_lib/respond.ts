import type { ApiErrorResponse } from '../../src/api/types';
import { MissingEnvError } from './env';
import { YouTubeApiError } from './youtubeDataApi';

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
