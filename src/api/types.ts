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

/** Uniform error body returned by every /api route when something goes wrong. */
export interface ApiErrorResponse {
  error: string;
}
