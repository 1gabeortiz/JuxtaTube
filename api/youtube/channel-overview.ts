import type { ChannelOverview } from '../../src/api/types';
import { requireEnv } from '../_lib/env';
import { jsonError, jsonOk, toErrorResponse } from '../_lib/respond';
import {
  bestThumbnail,
  toCount,
  youtubeDataRequest,
  type ListResponse,
  type RawChannel,
} from '../_lib/youtubeDataApi';

export default {
  async fetch(): Promise<Response> {
    try {
      const channelId = requireEnv('YT_CHANNEL_ID');

      // channels.list costs 1 quota unit.
      const data = await youtubeDataRequest<ListResponse<RawChannel>>('channels', {
        part: 'snippet,statistics,contentDetails',
        id: channelId,
      });

      const channel = data.items?.[0];
      if (!channel) {
        return jsonError('Channel not found. Check the YT_CHANNEL_ID value.', 404);
      }

      const overview: ChannelOverview = {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        publishedAt: channel.snippet.publishedAt,
        thumbnailUrl: bestThumbnail(channel.snippet.thumbnails),
        subscriberCount: toCount(channel.statistics.subscriberCount),
        hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount,
        viewCount: toCount(channel.statistics.viewCount),
        videoCount: toCount(channel.statistics.videoCount),
      };

      return jsonOk(overview);
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
