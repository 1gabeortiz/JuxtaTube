import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OWNER_KEY_HEADER } from '../../src/api/headers.js';
import { MissingEnvError } from './env.js';
import { requireOwner, UnauthorizedError } from './requireOwner.js';

const KEY = 'correct-horse-battery-staple';

function requestWith(headers?: Record<string, string>): Request {
  return new Request('https://example.test/api/analytics/overview', { headers });
}

describe('requireOwner', () => {
  beforeEach(() => {
    process.env.OWNER_ACCESS_KEY = KEY;
  });

  afterEach(() => {
    delete process.env.OWNER_ACCESS_KEY;
  });

  it('accepts a request carrying the exact key', () => {
    expect(() =>
      requireOwner(requestWith({ [OWNER_KEY_HEADER]: KEY })),
    ).not.toThrow();
  });

  it('rejects a request with no key at all', () => {
    expect(() => requireOwner(requestWith())).toThrow(UnauthorizedError);
  });

  it('rejects a wrong key of the same length', () => {
    expect(() =>
      requireOwner(requestWith({ [OWNER_KEY_HEADER]: 'x'.repeat(KEY.length) })),
    ).toThrow(UnauthorizedError);
  });

  // Both directions of partial match, since a comparison that only checks a
  // prefix would pass one of these.
  it('rejects a truncated or extended version of the key', () => {
    expect(() =>
      requireOwner(requestWith({ [OWNER_KEY_HEADER]: KEY.slice(0, -1) })),
    ).toThrow(UnauthorizedError);

    expect(() =>
      requireOwner(requestWith({ [OWNER_KEY_HEADER]: `${KEY}extra` })),
    ).toThrow(UnauthorizedError);
  });

  // timingSafeEqual throws a RangeError when the two buffers differ in length,
  // which would surface as a 500 and tell an attacker their guess was the wrong
  // size. The length check has to happen first and reject cleanly.
  it('rejects an empty key without letting a RangeError escape', () => {
    expect(() => requireOwner(requestWith({ [OWNER_KEY_HEADER]: '' }))).toThrow(
      UnauthorizedError,
    );
  });

  /**
   * The most important test here. If a missing OWNER_ACCESS_KEY were treated as
   * "no key required", a deployment that forgot to set the variable would expose
   * every private route while looking perfectly healthy.
   */
  it('fails closed when no key is configured on the server', () => {
    delete process.env.OWNER_ACCESS_KEY;

    expect(() =>
      requireOwner(requestWith({ [OWNER_KEY_HEADER]: KEY })),
    ).toThrow(MissingEnvError);
  });
});
