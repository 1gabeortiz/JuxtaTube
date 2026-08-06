import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearOwnerKey, setOwnerKey } from '../lib/ownerKey';
import { ApiError, fetchJson, isLocked, isNotConnected, postJson } from './client';
import { OWNER_KEY_HEADER } from './headers';

/**
 * A hand-rolled stand-in for Response.
 *
 * Only `ok`, `status`, and `json` are read by the client, and building the object
 * literally keeps the test independent of which fetch implementation the test
 * environment happens to provide.
 */
function fakeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** The headers the client actually sent, as a plain object. */
function sentHeaders(fetchMock: ReturnType<typeof stubFetch>): Record<string, string> {
  const init = fetchMock.mock.calls[0]?.[1];
  return Object.fromEntries(new Headers(init?.headers).entries());
}

afterEach(() => {
  clearOwnerKey();
});

describe('fetchJson', () => {
  it('returns the parsed body on success', async () => {
    stubFetch(fakeResponse({ subscriberCount: 10_800 }));

    await expect(fetchJson('/api/youtube/channel-overview')).resolves.toEqual({
      subscriberCount: 10_800,
    });
  });

  // The backend deliberately sends readable messages for cases the user can act
  // on, like "Channel is not connected". Those must reach the UI intact.
  it('surfaces the error message the backend chose', async () => {
    stubFetch(fakeResponse({ error: 'Channel is not connected.' }, 409));

    await expect(fetchJson('/api/auth/status')).rejects.toThrow(
      'Channel is not connected.',
    );
  });

  it('carries the status and code through so callers can branch on them', async () => {
    stubFetch(fakeResponse({ error: 'nope', code: 'not_connected' }, 409));

    await expect(fetchJson('/api/auth/status')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      code: 'not_connected',
    });
  });

  it('falls back to a generic message when the body is not JSON', async () => {
    stubFetch({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('Unexpected token < in JSON')),
    } as unknown as Response);

    // A gateway HTML error page must not surface as a JSON parsing error, which
    // tells the user nothing about what went wrong.
    await expect(fetchJson('/api/youtube/videos')).rejects.toThrow(
      'Request failed with status 502',
    );
  });

  it('throws ApiError specifically, not a bare Error', async () => {
    stubFetch(fakeResponse({ error: 'nope' }, 500));

    await expect(fetchJson('/api/youtube/videos')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('owner key handling', () => {
  it('sends no owner header while locked', async () => {
    const fetchMock = stubFetch(fakeResponse({}));

    await fetchJson('/api/analytics/overview');

    expect(sentHeaders(fetchMock)).not.toHaveProperty(OWNER_KEY_HEADER);
  });

  it('attaches the stored key once unlocked', async () => {
    setOwnerKey('secret-key');
    const fetchMock = stubFetch(fakeResponse({}));

    await fetchJson('/api/analytics/overview');

    expect(sentHeaders(fetchMock)[OWNER_KEY_HEADER]).toBe('secret-key');
  });

  // This is what lets the unlock form verify a candidate key before saving it,
  // so a wrong guess never gets written to sessionStorage.
  it('lets an explicit header override the stored key', async () => {
    setOwnerKey('old-key');
    const fetchMock = stubFetch(fakeResponse({ owner: true }));

    await fetchJson('/api/auth/owner', {
      headers: { [OWNER_KEY_HEADER]: 'candidate-key' },
    });

    expect(sentHeaders(fetchMock)[OWNER_KEY_HEADER]).toBe('candidate-key');
  });
});

describe('error predicates', () => {
  it('identifies a locked route', () => {
    expect(isLocked(new ApiError('private', 401, 'locked'))).toBe(true);
    expect(isLocked(new ApiError('expired', 401))).toBe(false);
  });

  it('identifies a missing channel connection', () => {
    expect(isNotConnected(new ApiError('nope', 409, 'not_connected'))).toBe(true);
    expect(isNotConnected(new ApiError('conflict', 409))).toBe(false);
  });

  it('ignores errors that did not come from the API', () => {
    expect(isLocked(new Error('network down'))).toBe(false);
    expect(isNotConnected(null)).toBe(false);
  });
});

describe('postJson', () => {
  it('sends a JSON body with the matching content type', async () => {
    const fetchMock = stubFetch(fakeResponse({ channelId: 'UC123' }));

    await postJson('/api/youtube/competitors', { channel: '@someone' });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init).toMatchObject({ method: 'POST', body: '{"channel":"@someone"}' });
    expect(sentHeaders(fetchMock)['content-type']).toBe('application/json');
  });

  it('sends an empty object when there is no body', async () => {
    const fetchMock = stubFetch(fakeResponse({ ok: true }));

    await postJson('/api/auth/disconnect');

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ body: '{}' });
  });
});
