import type { VideoSummary, VideosResponse } from '../../src/api/types';
import { requireEnv } from '../_lib/env';
import { jsonError, jsonOk, toErrorResponse } from '../_lib/respond';
import {
  bestThumbnail,
  toCount,
  youtubeDataRequest,
  type ListResponse,
  type RawChannel,
  type RawPlaylistItem,
  type RawVideo,
} from '../_lib/youtubeDataApi';

const DEFAULT_LIMIT = 12;
// videos.list accepts at most 50 IDs per call, so one page is the ceiling here.
const MAX_LIMIT = 50;

function parseLimit(raw: string | null): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

/**
 * The "uploads playlist" pattern.
 *
 * The obvious way to list a channel's videos is search.list, which costs 100
 * quota units per call out of a 10,000/day budget. Every channel also has an
 * auto-generated "all uploads" playlist, and reading a playlist costs 1 unit.
 * Going channels -> playlistItems -> videos costs 3 units for the same result:
 * roughly 33x cheaper, and it returns reliable newest-first ordering.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const channelId = requireEnv('YT_CHANNEL_ID');
      const limit = parseLimit(new URL(request.url).searchParams.get('limit'));

      // Step 1 (1 unit) — find the uploads playlist for this channel.
      const channelData = await youtubeDataRequest<
        ListResponse<Pick<RawChannel, 'contentDetails'>>
      >('channels', {
        part: 'contentDetails',
        id: channelId,
      });

      const uploadsPlaylistId =
        channelData.items?.[0]?.contentDetails.relatedPlaylists.uploads;
      if (!uploadsPlaylistId) {
        return jsonError('Channel not found. Check the YT_CHANNEL_ID value.', 404);
      }

      // Step 2 (1 unit) — newest-first video IDs from that playlist.
      const playlistData = await youtubeDataRequest<ListResponse<RawPlaylistItem>>(
        'playlistItems',
        {
          part: 'contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults: String(limit),
        },
      );

      const videoIds = (playlistData.items ?? []).map((item) => item.contentDetails.videoId);
      if (videoIds.length === 0) {
        const empty: VideosResponse = { videos: [] };
        return jsonOk(empty);
      }

      // Step 3 (1 unit) — full details for every ID in a single batched call.
      const videoData = await youtubeDataRequest<ListResponse<RawVideo>>('videos', {
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(','),
      });

      const byId = new Map<string, RawVideo>(
        (videoData.items ?? []).map((video) => [video.id, video]),
      );

      // videos.list does not promise to echo the order of the IDs we sent, so
      // reorder against the playlist to keep the newest-first guarantee.
      const videos: VideoSummary[] = videoIds
        .map((id) => byId.get(id))
        .filter((video): video is RawVideo => video !== undefined)
        .map((video) => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          publishedAt: video.snippet.publishedAt,
          thumbnailUrl: bestThumbnail(video.snippet.thumbnails),
          duration: video.contentDetails.duration,
          viewCount: toCount(video.statistics.viewCount),
          likeCount: toCount(video.statistics.likeCount),
          commentCount: toCount(video.statistics.commentCount),
          tags: video.snippet.tags ?? [],
        }));

      const body: VideosResponse = { videos };
      return jsonOk(body);
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
