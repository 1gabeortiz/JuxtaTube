import type { TagExplorerResult, TagFrequency } from '../../src/api/types.js';
import { jsonError, jsonOk, toErrorResponse } from '../_lib/respond.js';
import {
  channelLookupParam,
  youtubeDataRequest,
  type ListResponse,
  type RawChannel,
  type RawPlaylistItem,
  type RawSearchResult,
  type RawVideo,
} from '../_lib/youtubeDataApi.js';

/** videos.list accepts at most 50 IDs per call, so one batch is the ceiling. */
const MAX_VIDEOS = 50;

/** Enough to spot patterns without producing an unreadable wall of chips. */
const MAX_TAGS = 60;

// Quota costs per the Data API pricing table: reads are 1 unit, search is 100.
const COST_LIST = 1;
const COST_SEARCH = 100;

/** Only the parts this route requests, rather than the full video shape. */
type VideoTags = Pick<RawVideo, 'id' | 'snippet'>;

/**
 * Ranks tags by how many videos use them.
 *
 * Counting is case-insensitive and deduplicated per video, so a single video
 * repeating "type beat" cannot inflate the ranking. The first spelling seen is
 * kept for display, since tags are shown to a human.
 */
function rankTags(videos: VideoTags[]): TagFrequency[] {
  const counts = new Map<string, TagFrequency>();

  for (const video of videos) {
    const seenInThisVideo = new Set<string>();

    for (const rawTag of video.snippet.tags ?? []) {
      const tag = rawTag.trim();
      if (!tag) continue;

      const key = tag.toLowerCase();
      if (seenInThisVideo.has(key)) continue;
      seenInThisVideo.add(key);

      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { tag, count: 1 });
      }
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, MAX_TAGS);
}

/** Batched lookup of tags for a set of video IDs. Costs 1 unit. */
async function fetchTagsForVideos(videoIds: string[]): Promise<VideoTags[]> {
  if (videoIds.length === 0) return [];

  const data = await youtubeDataRequest<ListResponse<VideoTags>>('videos', {
    part: 'snippet',
    id: videoIds.slice(0, MAX_VIDEOS).join(','),
  });

  return data.items ?? [];
}

/** Channel mode — 3 units via the uploads-playlist pattern. */
async function exploreChannel(input: string): Promise<TagExplorerResult> {
  const channelData = await youtubeDataRequest<
    ListResponse<Pick<RawChannel, 'snippet' | 'contentDetails'>>
  >('channels', {
    part: 'snippet,contentDetails',
    ...channelLookupParam(input),
  });

  const channel = channelData.items?.[0];
  if (!channel) {
    throw new ChannelNotFoundError();
  }

  const playlistData = await youtubeDataRequest<ListResponse<RawPlaylistItem>>(
    'playlistItems',
    {
      part: 'contentDetails',
      playlistId: channel.contentDetails.relatedPlaylists.uploads,
      maxResults: String(MAX_VIDEOS),
    },
  );

  const videoIds = (playlistData.items ?? []).map((item) => item.contentDetails.videoId);
  const videos = await fetchTagsForVideos(videoIds);

  return {
    mode: 'channel',
    query: channel.snippet.title,
    videosScanned: videos.length,
    quotaCost: COST_LIST * 3,
    tags: rankTags(videos),
  };
}

/**
 * Keyword mode — 101 units, and unavoidable.
 *
 * There is no cheap way to find videos matching an arbitrary phrase: search.list
 * is the only endpoint that does it, and it costs 100 units of a 10,000/day
 * budget. That still allows roughly 100 keyword searches a day, far more than a
 * personal tool needs, but the cost is surfaced in the response so it stays
 * visible rather than silently draining quota.
 */
async function exploreKeyword(keyword: string): Promise<TagExplorerResult> {
  const searchData = await youtubeDataRequest<ListResponse<RawSearchResult>>('search', {
    part: 'snippet',
    q: keyword,
    type: 'video',
    order: 'relevance',
    maxResults: String(MAX_VIDEOS),
  });

  const videoIds = (searchData.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => id !== undefined);

  const videos = await fetchTagsForVideos(videoIds);

  return {
    mode: 'keyword',
    query: keyword,
    videosScanned: videos.length,
    quotaCost: COST_SEARCH + COST_LIST,
    tags: rankTags(videos),
  };
}

class ChannelNotFoundError extends Error {}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return jsonError('Method not allowed.', 405);
    }

    try {
      const params = new URL(request.url).searchParams;
      const channel = params.get('channel')?.trim() ?? '';
      const keyword = params.get('keyword')?.trim() ?? '';

      // Channel mode wins when both are given: it is 33x cheaper, so defaulting
      // to it makes an ambiguous request the inexpensive one.
      if (channel) {
        const result = await exploreChannel(channel);
        // A day is fine: a channel's recent uploads and their tags barely move.
        return jsonOk(result, 86_400);
      }

      if (keyword) {
        const result = await exploreKeyword(keyword);
        return jsonOk(result, 86_400);
      }

      return jsonError('Provide either a channel or a keyword.', 400);
    } catch (error) {
      if (error instanceof ChannelNotFoundError) {
        return jsonError('No channel found for that ID or handle.', 404);
      }
      return toErrorResponse(error);
    }
  },
};
