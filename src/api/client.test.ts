import { describe, expect, it, vi } from 'vitest';
import { ApiError, fetchJson, postJson } from './client';

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

  it('attaches the status code so callers can branch on it', async () => {
    stubFetch(fakeResponse({ error: 'nope' }, 409));

    // 409 is what the Analytics page checks to show its Connect prompt instead
    // of a generic failure card.
    await expect(fetchJson('/api/auth/status')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
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

describe('postJson', () => {
  it('sends a JSON body with the matching content type', async () => {
    const fetchMock = stubFetch(fakeResponse({ channelId: 'UC123' }));

    await postJson('/api/youtube/competitors', { channel: '@someone' });

    expect(fetchMock).toHaveBeenCalledWith('/api/youtube/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"channel":"@someone"}',
    });
  });

  it('sends an empty object when there is no body', async () => {
    const fetchMock = stubFetch(fakeResponse({ ok: true }));

    await postJson('/api/auth/disconnect');

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ body: '{}' });
  });
});
