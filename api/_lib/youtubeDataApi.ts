import { requireEnv } from './env.js';
import { getValidAccessToken } from './getAccessToken.js';

const DATA_API_BASE = 'https://www.googleapis.com/youtube/v3';

export class YouTubeApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    // No response body in the message: Data API errors can echo back the
    // request, and the request URL contains our API key.
    super(`YouTube Data API responded with ${status}`);
    this.name = 'YouTubeApiError';
    this.status = status;
  }
}

/** Shared wrapper so the API key is attached in exactly one place. */
export async function youtubeDataRequest<T>(
  resource: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${DATA_API_BASE}/${resource}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('key', requireEnv('YT_DATA_API_KEY'));

  const response = await fetch(url);
  if (!response.ok) {
    throw new YouTubeApiError(response.status);
  }

  return (await response.json()) as T;
}

/**
 * Same Data API, but authorized as the channel owner instead of by API key.
 *
 * A few parts — `suggestions` most notably — are only returned for videos the
 * authenticated user owns. An API key proves which *app* is calling; only OAuth
 * proves *who* is calling, which is what Google requires here.
 */
export async function youtubeDataRequestAuthed<T>(
  resource: string,
  params: Record<string, string>,
): Promise<T> {
  const accessToken = await getValidAccessToken();

  const url = new URL(`${DATA_API_BASE}/${resource}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new YouTubeApiError(response.status);
  }

  return (await response.json()) as T;
}

// --- Raw response shapes from the Data API v3 ---------------------------
// Only the fields this app actually requests are modeled. Note that every
// numeric statistic arrives as a STRING and must be converted before use.

interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

interface Thumbnails {
  default?: Thumbnail;
  medium?: Thumbnail;
  high?: Thumbnail;
  standard?: Thumbnail;
  maxres?: Thumbnail;
}

export interface RawChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: Thumbnails;
  };
  statistics: {
    viewCount: string;
    subscriberCount?: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  contentDetails: {
    relatedPlaylists: { uploads: string };
  };
}

export interface RawPlaylistItem {
  contentDetails: { videoId: string };
}

export interface RawVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: Thumbnails;
    tags?: string[];
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails: { duration: string };
}

/** One tag YouTube itself recommends for an owned video. */
export interface RawTagSuggestion {
  tag: string;
  categoryRestricts?: string[];
}

export interface RawVideoSuggestions {
  id: string;
  snippet?: {
    title: string;
    channelId: string;
    tags?: string[];
  };
  suggestions?: {
    tagSuggestions?: RawTagSuggestion[];
  };
}

/** search.list nests the id, unlike videos.list where it is a plain string. */
export interface RawSearchResult {
  id?: { videoId?: string };
}

export interface ListResponse<T> {
  items?: T[];
  nextPageToken?: string;
}

/** Highest-resolution thumbnail available, falling back down the ladder. */
export function bestThumbnail(thumbnails: Thumbnails): string {
  return (
    thumbnails.maxres?.url ??
    thumbnails.standard?.url ??
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url ??
    ''
  );
}

/** Data API sends counts as strings; missing values mean "hidden by owner". */
export function toCount(value: string | undefined): number {
  if (value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
