import type { Competitor, CompetitorsResponse } from '../../src/api/types.js';
import {
  addTrackedCompetitor,
  getTrackedCompetitors,
  removeTrackedCompetitor,
  MAX_TRACKED,
} from '../_lib/competitorStore.js';
import { SupabaseError } from '../_lib/postgrest.js';
import { requireOwner } from '../_lib/requireOwner.js';
import { jsonError, jsonNoStore, toErrorResponse } from '../_lib/respond.js';
import {
  bestThumbnail,
  channelLookupParam,
  toCount,
  youtubeDataRequest,
  type ListResponse,
  type RawChannel,
} from '../_lib/youtubeDataApi.js';

type ChannelStats = Pick<RawChannel, 'id' | 'snippet' | 'statistics'>;

/**
 * Current public stats for every tracked channel.
 *
 * All channel IDs go into a single channels.list call, so the cost is 1 quota
 * unit whether you track one competitor or fifty — which is also why 50 is the
 * ceiling, since that is the API's per-request limit.
 */
async function handleGet(): Promise<Response> {
  const tracked = await getTrackedCompetitors();

  if (tracked.length === 0) {
    const empty: CompetitorsResponse = { competitors: [], maxTracked: MAX_TRACKED };
    return jsonNoStore(empty);
  }

  const data = await youtubeDataRequest<ListResponse<ChannelStats>>('channels', {
    part: 'snippet,statistics',
    id: tracked.map((row) => row.channel_id).join(','),
  });

  const liveById = new Map<string, ChannelStats>(
    (data.items ?? []).map((channel) => [channel.id, channel]),
  );

  const competitors: Competitor[] = tracked.map((row) => {
    const live = liveById.get(row.channel_id);

    return {
      channelId: row.channel_id,
      // Prefer YouTube's current title so renames show up, falling back to the
      // name captured when the channel was added.
      channelName: live?.snippet.title ?? row.channel_name,
      addedAt: row.added_at,
      thumbnailUrl: live ? bestThumbnail(live.snippet.thumbnails) : '',
      subscriberCount: live ? toCount(live.statistics.subscriberCount) : null,
      hiddenSubscriberCount: live?.statistics.hiddenSubscriberCount ?? false,
      viewCount: live ? toCount(live.statistics.viewCount) : null,
      videoCount: live ? toCount(live.statistics.videoCount) : null,
    };
  });

  const payload: CompetitorsResponse = { competitors, maxTracked: MAX_TRACKED };
  return jsonNoStore(payload);
}

/** Adds a channel by ID or @handle, resolving its real title first. */
async function handlePost(request: Request): Promise<Response> {
  requireOwner(request);

  const body = (await request.json()) as { channel?: unknown };
  const input = typeof body.channel === 'string' ? body.channel.trim() : '';
  if (input === '') {
    return jsonError('Provide a channel ID or @handle.', 400);
  }

  const existing = await getTrackedCompetitors();
  if (existing.length >= MAX_TRACKED) {
    return jsonError(
      `You can track up to ${MAX_TRACKED} channels. Remove one first.`,
      409,
    );
  }

  const data = await youtubeDataRequest<ListResponse<Pick<RawChannel, 'id' | 'snippet'>>>(
    'channels',
    { part: 'snippet', ...channelLookupParam(input) },
  );

  const channel = data.items?.[0];
  if (!channel) {
    return jsonError('No channel found for that ID or handle.', 404);
  }

  try {
    await addTrackedCompetitor(channel.id, channel.snippet.title);
  } catch (error) {
    // PostgREST answers 409 when the unique constraint on channel_id rejects a
    // duplicate. That is a normal user action, not a failure worth surfacing raw.
    if (error instanceof SupabaseError && error.status === 409) {
      return jsonError('You are already tracking that channel.', 409);
    }
    throw error;
  }

  return jsonNoStore({ channelId: channel.id, channelName: channel.snippet.title });
}

async function handleDelete(request: Request): Promise<Response> {
  requireOwner(request);

  const channelId = new URL(request.url).searchParams.get('channelId')?.trim() ?? '';
  if (channelId === '') {
    return jsonError('Provide a channelId to remove.', 400);
  }

  await removeTrackedCompetitor(channelId);
  return jsonNoStore({ removed: channelId });
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      if (request.method === 'GET') return await handleGet();
      if (request.method === 'POST') return await handlePost(request);
      if (request.method === 'DELETE') return await handleDelete(request);
      return jsonError('Method not allowed.', 405);
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
