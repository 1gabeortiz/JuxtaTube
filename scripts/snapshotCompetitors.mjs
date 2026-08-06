/**
 * Records one row of public stats per tracked competitor, for today.
 *
 * Why this exists: the YouTube API reports a channel's counts only as of right
 * now. There is no endpoint for "what were this channel's subscribers last
 * month" unless you own it. So growth charts are only possible if the app builds
 * its own history — which means something has to run on a schedule and write a
 * daily row. That is this script, invoked by
 * .github/workflows/competitor-snapshot.yml.
 *
 * Plain .mjs with no dependencies on purpose: it runs in CI, where a build step
 * would be pure overhead for what amounts to two HTTP calls.
 */

const DATA_API_BASE = 'https://www.googleapis.com/youtube/v3';

/** channels.list accepts at most 50 IDs, so one batch covers every tracked row. */
const MAX_IDS_PER_REQUEST = 50;

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function supabaseHeaders(extra = {}) {
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function supabaseRequest(path, init) {
  const base = requireEnv('SUPABASE_URL').replace(/\/+$/, '');
  const response = await fetch(`${base}/rest/v1/${path}`, init);

  if (!response.ok) {
    throw new Error(
      `Supabase ${init.method ?? 'GET'} ${path} failed: ${response.status} ${await response.text()}`,
    );
  }

  return response;
}

async function fetchTrackedChannelIds() {
  const response = await supabaseRequest('tracked_competitors?select=channel_id', {
    method: 'GET',
    headers: supabaseHeaders(),
  });
  const rows = await response.json();
  return rows.map((row) => row.channel_id);
}

async function fetchChannelStats(channelIds) {
  const url = new URL(`${DATA_API_BASE}/channels`);
  url.searchParams.set('part', 'statistics');
  url.searchParams.set('id', channelIds.join(','));
  url.searchParams.set('key', requireEnv('YT_DATA_API_KEY'));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `YouTube channels.list failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = await response.json();
  return data.items ?? [];
}

/** Data API sends counts as strings, and omits them when the owner hides them. */
function toCount(value) {
  if (value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function main() {
  const channelIds = await fetchTrackedChannelIds();

  if (channelIds.length === 0) {
    console.log('No tracked competitors. Nothing to snapshot.');
    return;
  }

  if (channelIds.length > MAX_IDS_PER_REQUEST) {
    throw new Error(
      `${channelIds.length} tracked channels exceeds the ${MAX_IDS_PER_REQUEST}-ID batch limit.`,
    );
  }

  const items = await fetchChannelStats(channelIds);
  const snapshotDate = new Date().toISOString().slice(0, 10);

  const rows = items.map((channel) => ({
    channel_id: channel.id,
    snapshot_date: snapshotDate,
    subscriber_count: toCount(channel.statistics?.subscriberCount),
    view_count: toCount(channel.statistics?.viewCount),
    video_count: toCount(channel.statistics?.videoCount),
  }));

  if (rows.length === 0) {
    throw new Error('YouTube returned no channels for the tracked IDs.');
  }

  // merge-duplicates makes the run idempotent against the unique constraint on
  // (channel_id, snapshot_date), so a retry or a manual re-run overwrites
  // today's row instead of failing.
  await supabaseRequest('competitor_snapshots', {
    method: 'POST',
    headers: supabaseHeaders({
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify(rows),
  });

  const missing = channelIds.length - rows.length;
  console.log(
    `Snapshotted ${rows.length} channel(s) for ${snapshotDate}.` +
      (missing > 0 ? ` ${missing} tracked ID(s) returned no data.` : ''),
  );
}

main().catch((error) => {
  console.error(error.message);
  // Non-zero exit so the Actions run is marked failed and surfaces in the UI,
  // rather than silently recording nothing for the day.
  process.exit(1);
});
