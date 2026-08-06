import { deleteRows, insertRows, selectRows } from './postgrest.js';

const TRACKED_TABLE = 'tracked_competitors';
const SNAPSHOTS_TABLE = 'competitor_snapshots';

/** Batching ceiling for channels.list, which also caps how many we track. */
export const MAX_TRACKED = 50;

export interface TrackedCompetitorRow {
  channel_id: string;
  channel_name: string;
  added_at: string;
}

export interface SnapshotRow {
  channel_id: string;
  snapshot_date: string;
  subscriber_count: number | null;
  view_count: number | null;
  video_count: number | null;
}

export function getTrackedCompetitors(): Promise<TrackedCompetitorRow[]> {
  return selectRows<TrackedCompetitorRow>(
    `${TRACKED_TABLE}?select=channel_id,channel_name,added_at&order=added_at.asc`,
  );
}

export function addTrackedCompetitor(
  channelId: string,
  channelName: string,
): Promise<void> {
  return insertRows(TRACKED_TABLE, {
    channel_id: channelId,
    channel_name: channelName,
  });
}

/**
 * Removing a tracked channel also drops its snapshots, via `on delete cascade`
 * in the schema. Keeping orphaned history would mean the growth chart could
 * still render a channel the user explicitly stopped following.
 */
export function removeTrackedCompetitor(channelId: string): Promise<void> {
  return deleteRows(TRACKED_TABLE, `channel_id=eq.${encodeURIComponent(channelId)}`);
}

/** Snapshots from `sinceDate` (YYYY-MM-DD) onward, oldest first for charting. */
export function getSnapshotsSince(sinceDate: string): Promise<SnapshotRow[]> {
  return selectRows<SnapshotRow>(
    `${SNAPSHOTS_TABLE}?select=channel_id,snapshot_date,subscriber_count,view_count,video_count` +
      `&snapshot_date=gte.${sinceDate}&order=snapshot_date.asc`,
  );
}
