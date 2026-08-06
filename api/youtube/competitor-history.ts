import type {
  CompetitorHistory,
  CompetitorHistoryResponse,
  CompetitorSnapshotPoint,
} from '../../src/api/types.js';
import { getSnapshotsSince, getTrackedCompetitors } from '../_lib/competitorStore.js';
import { jsonError, jsonOk, toErrorResponse } from '../_lib/respond.js';

const DEFAULT_DAYS = 90;
const MAX_DAYS = 730;

function parseDays(raw: string | null): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_DAYS;
  return Math.min(parsed, MAX_DAYS);
}

/**
 * Recorded growth history for every tracked channel.
 *
 * This reads only our own snapshot table and calls no YouTube endpoint, so it
 * costs zero quota. It is also why the data starts empty: the history is
 * whatever the daily job has managed to record so far, and a chart with one
 * point on day one is correct rather than broken.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return jsonError('Method not allowed.', 405);
    }

    try {
      const days = parseDays(new URL(request.url).searchParams.get('days'));

      const since = new Date();
      since.setUTCDate(since.getUTCDate() - (days - 1));
      const startDate = since.toISOString().slice(0, 10);

      const [tracked, snapshots] = await Promise.all([
        getTrackedCompetitors(),
        getSnapshotsSince(startDate),
      ]);

      const pointsByChannel = new Map<string, CompetitorSnapshotPoint[]>();
      for (const snapshot of snapshots) {
        const points = pointsByChannel.get(snapshot.channel_id) ?? [];
        points.push({
          date: snapshot.snapshot_date,
          subscriberCount: snapshot.subscriber_count,
          viewCount: snapshot.view_count,
          videoCount: snapshot.video_count,
        });
        pointsByChannel.set(snapshot.channel_id, points);
      }

      // Driven by the tracked list rather than the snapshots, so a newly added
      // channel appears immediately with an empty series instead of vanishing
      // until the job next runs.
      const histories: CompetitorHistory[] = tracked.map((row) => ({
        channelId: row.channel_id,
        channelName: row.channel_name,
        points: pointsByChannel.get(row.channel_id) ?? [],
      }));

      const payload: CompetitorHistoryResponse = { startDate, histories };

      // An hour: the underlying data only changes when the daily job runs.
      return jsonOk(payload, 3600);
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
