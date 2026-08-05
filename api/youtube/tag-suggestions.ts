import type { TagSuggestions } from '../../src/api/types.js';
import { requireEnv } from '../_lib/env.js';
import { jsonError, jsonOk, toErrorResponse } from '../_lib/respond.js';
import {
  youtubeDataRequestAuthed,
  type ListResponse,
  type RawVideoSuggestions,
} from '../_lib/youtubeDataApi.js';

/** YouTube video IDs are 11 characters of URL-safe base64. */
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Official tag suggestions that YouTube generates for one of your own videos.
 *
 * This is the counterpart to the tag explorer: the explorer tells you what other
 * creators are using, while this tells you what YouTube's own systems associate
 * with your specific video. Only the owner can read it, so it goes through OAuth
 * rather than the API key.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return jsonError('Method not allowed.', 405);
    }

    try {
      const videoId = new URL(request.url).searchParams.get('videoId')?.trim() ?? '';
      if (!VIDEO_ID_PATTERN.test(videoId)) {
        return jsonError('Provide a valid videoId.', 400);
      }

      const data = await youtubeDataRequestAuthed<ListResponse<RawVideoSuggestions>>(
        'videos',
        {
          // `suggestions` is the owner-only part that carries tagSuggestions.
          part: 'snippet,suggestions',
          id: videoId,
        },
      );

      const video = data.items?.[0];
      if (!video) {
        return jsonError('Video not found.', 404);
      }

      // Guard against looking up someone else's video. Google would reject it
      // anyway, but a 403 from them is far less clear than saying so directly.
      if (video.snippet && video.snippet.channelId !== requireEnv('YT_CHANNEL_ID')) {
        return jsonError('That video belongs to a different channel.', 403);
      }

      const payload: TagSuggestions = {
        videoId,
        videoTitle: video.snippet?.title ?? '',
        currentTags: video.snippet?.tags ?? [],
        suggestions: (video.suggestions?.tagSuggestions ?? []).map((suggestion) => ({
          tag: suggestion.tag,
          categoryRestricts: suggestion.categoryRestricts ?? [],
        })),
      };

      return jsonOk(payload, 3600);
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
