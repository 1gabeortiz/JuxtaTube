/**
 * Response shapes for this app's own /api routes.
 *
 * These are deliberately NOT raw YouTube API shapes. The backend normalizes
 * Google's responses before returning them, which means two things for the
 * frontend: numeric counts arrive as real numbers (the Data API sends them as
 * strings), and a change in Google's response format only has to be absorbed
 * in one place instead of rippling through every component.
 */

export interface ChannelOverview {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  subscriberCount: number;
  /** True when the channel owner has chosen to hide the subscriber count. */
  hiddenSubscriberCount: boolean;
  viewCount: number;
  videoCount: number;
}

export interface VideoSummary {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  /** ISO 8601 duration, e.g. "PT4M13S". Format with parseDuration before display. */
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
}

export interface VideosResponse {
  videos: VideoSummary[];
}

export interface TagSuggestion {
  tag: string;
  /** Video categories the tag is considered relevant to. Often empty. */
  categoryRestricts: string[];
}

export interface TagSuggestions {
  videoId: string;
  videoTitle: string;
  /** Tags already on the video, so you can compare against the suggestions. */
  currentTags: string[];
  suggestions: TagSuggestion[];
}

export interface TagFrequency {
  tag: string;
  /** How many of the scanned videos used this tag. */
  count: number;
}

export interface TagExplorerResult {
  mode: 'channel' | 'keyword';
  /** Echo of what was searched, resolved to a channel title in channel mode. */
  query: string;
  videosScanned: number;
  /** Data API units this request consumed, so the cost stays visible. */
  quotaCost: number;
  tags: TagFrequency[];
}

/** One day of channel performance. `date` is YYYY-MM-DD. */
export interface AnalyticsDayPoint {
  date: string;
  views: number;
  estimatedMinutesWatched: number;
  subscribersGained: number;
  subscribersLost: number;
}

export interface AnalyticsTotals {
  views: number;
  estimatedMinutesWatched: number;
  subscribersGained: number;
  subscribersLost: number;
  /** Gained minus lost — the number that actually moved your subscriber count. */
  netSubscribers: number;
}

export interface AnalyticsOverview {
  startDate: string;
  endDate: string;
  totals: AnalyticsTotals;
  days: AnalyticsDayPoint[];
}

export interface AgeGenderSlice {
  /** Google's bucket label, e.g. "age18-24". */
  ageGroup: string;
  /** "male", "female", or "user_specified". */
  gender: string;
  /** Share of views, 0–100. Does not sum to 100 per gender. */
  viewerPercentage: number;
}

export interface CountrySlice {
  /** ISO 3166-1 alpha-2 code, e.g. "US". */
  code: string;
  views: number;
  estimatedMinutesWatched: number;
}

export interface Demographics {
  startDate: string;
  endDate: string;
  ageGender: AgeGenderSlice[];
  countries: CountrySlice[];
}

export interface TrafficSourceSlice {
  /** Google's raw enum, e.g. "YT_SEARCH". */
  source: string;
  /** Readable form, e.g. "YouTube search". */
  label: string;
  views: number;
  estimatedMinutesWatched: number;
}

export interface TrafficSources {
  startDate: string;
  endDate: string;
  sources: TrafficSourceSlice[];
}

export interface AuthStatus {
  connected: boolean;
  /** ISO timestamp of when the connection was last written, or null. */
  connectedAt: string | null;
}

/** Uniform error body returned by every /api route when something goes wrong. */
export interface ApiErrorResponse {
  error: string;
}
